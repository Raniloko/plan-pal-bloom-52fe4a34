# Migrations- & Sicherheitskonzept: Supabase → All-Inkl (PHP + MySQL)

> **Status:** Konzept-Dokument. Der Umbau erfolgt **später**. Aktuell bleibt das Supabase-Setup unverändert aktiv.

## Entscheidungen

| Bereich | Wahl |
|---|---|
| Start | Konzept dokumentieren, Umbau später |
| Realtime | Server-Sent Events (SSE) |
| Admin-Login | E-Mail + Passwort + IP-Whitelist |
| E-Mail | All-Inkl SMTP via PHPMailer |

---

## 1. Zielarchitektur

```text
Browser (React Build)
   │  HTTPS + CSRF-Token
   ▼
/www/                        ← Web-Root (öffentlich)
  ├── index.html             ← React SPA
  ├── assets/                ← JS/CSS Bundles
  ├── api/*.php              ← öffentliche Endpunkte
  ├── sse/notifications.php  ← Server-Sent Events Stream
  ├── admin/*.php            ← Admin-API (Session + IP-Check)
  ├── cron/auto-cancel.php   ← Cron-Endpoint (Token-geschützt)
  └── .htaccess              ← HTTPS, SPA-Fallback, Härtung

/private/                    ← außerhalb Web-Root, NIE web-erreichbar
  ├── config.php             ← DB + SMTP + Resend Credentials
  ├── ip-whitelist.php       ← Admin-IP-Liste
  ├── lib/
  │   ├── db.php             ← PDO-Connection
  │   ├── auth.php           ← Session + IP-Check
  │   ├── csrf.php           ← Token-Generierung/Prüfung
  │   ├── rate_limit.php     ← Sliding-Window-Limiter
  │   ├── validate.php       ← Whitelist-Validatoren
  │   └── headers.php        ← Sicherheits-Header
  ├── PHPMailer/             ← SMTP-Bibliothek
  ├── logs/                  ← Error-/Access-Logs
  └── backups/               ← mysqldump-Dateien
```

**Kommunikation:** Frontend ruft ausschließlich `fetch('/api/...')` bzw. `new EventSource('/sse/...')` auf. Keine DB-Credentials im Browser.

---

## 2. Datenbank (MySQL/MariaDB auf All-Inkl)

- PDO mit:
  - `PDO::ATTR_EMULATE_PREPARES = false`
  - `PDO::ATTR_ERRMODE = PDO::ERRMODE_EXCEPTION`
  - `PDO::ATTR_DEFAULT_FETCH_MODE = PDO::FETCH_ASSOC`
- **Ausschließlich Prepared Statements** — kein einziges String-Concat-SQL
- DB-User mit minimalen Rechten: `SELECT, INSERT, UPDATE, DELETE` — **kein** `DROP`, `GRANT`, `ALTER`
- Charset `utf8mb4`, Collation `utf8mb4_unicode_ci`
- Verbindung nur über `localhost` (kein Remote-Zugriff)
- Credentials ausschließlich in `/private/config.php`

---

## 3. Admin-Login mit IP-Whitelist

**Reihenfolge der Prüfungen** in jedem `admin/*.php`:

1. **IP-Whitelist** — vor allem anderen. Nicht-erlaubte IPs bekommen sofort `HTTP 403`, kein Login-Formular, kein Hinweis warum.
   - Konfiguration: `/private/ip-whitelist.php` als Array (Einzel-IPs + CIDR-Bereiche)
   - Helper-Funktion prüft `$_SERVER['REMOTE_ADDR']` gegen Liste
2. **Session-Check** — gültige PHP-Session vorhanden?
3. **Rolle** — User hat `admin`-Rolle?

**Passwort-Speicherung:**
- `password_hash($pw, PASSWORD_BCRYPT, ['cost' => 12])`
- `password_verify()` zur Prüfung
- `password_needs_rehash()` für späteres Cost-Upgrade

**Session-Konfiguration** (in `auth.php` vor `session_start()`):
```php
session_set_cookie_params([
  'lifetime' => 0,
  'path'     => '/',
  'domain'   => '',
  'secure'   => true,
  'httponly' => true,
  'samesite' => 'Strict',
]);
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
```

**Brute-Force-Schutz:**
- Tabelle `login_attempts (id, email, ip, attempted_at, success)`
- Vor jedem Login-Versuch: zähle Fehlversuche der letzten 15 Min für (E-Mail + IP)
- Bei `>= 5` Fehlversuchen: `HTTP 429`, kein Passwort-Check
- Erfolgreiche Logins zurücksetzen

---

## 4. Öffentliche Endpunkte (Reservierung erstellen / ändern / stornieren)

**CSRF-Schutz:**
- Token bei jedem Seitenaufruf in Session generieren, im DOM (Meta-Tag) bereitstellen
- Frontend sendet Token im Header `X-CSRF-Token` bei allen `POST/PUT/DELETE`
- Server vergleicht mit Session-Token (timing-safe via `hash_equals`)

**Rate-Limiting:**
- Tabelle `rate_limits (id, ip, endpoint, requested_at)`
- Sliding Window: max. N Requests pro IP+Endpoint pro Zeitfenster
- Beispiel: 5 Reservierungen / 10 Min, 10 Stornierungen / 60 Min

**Honeypot:**
- Bestehendes `honeypot`-Feld bleibt — befüllt = sofort `HTTP 200` mit Fake-Erfolg, kein DB-Insert

**Server-seitige Validierung (`validate.php`):**
- `zone` ∈ Whitelist (`restaurant`, `vip`, `billard`, `fenster`, `rondo`)
- `occasion` ∈ Whitelist
- E-Mail via `filter_var(FILTER_VALIDATE_EMAIL)`
- Telefon via Regex (Ziffern, +, Leerzeichen, Bindestrich, Klammern, Länge 6–25)
- Längen-Limits: Name ≤ 100, Message ≤ 1000
- Datum/Zeit per `DateTimeImmutable` parsen, Vergangenheit ablehnen
- `guest_count` Integer 1–50

**Cancellation-Token:**
- UUID v4 bei Reservierung erzeugen (`random_bytes(16)` → Format)
- In Bestätigungs-Mail als Link mitsenden
- Nach erfolgreicher Stornierung/Änderung: `cancellation_token = NULL` setzen
- Bei NULL-Token → `HTTP 410 Gone`

**Output-Escaping:**
- `htmlspecialchars($val, ENT_QUOTES | ENT_HTML5, 'UTF-8')` bei jeder Ausgabe in HTML/Mail-Template
- JSON-Antworten via `json_encode($data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)`

---

## 5. SSE-Endpunkt für Realtime-Dashboard

**Datei:** `/www/sse/notifications.php`

**Setup:**
```php
require '/private/lib/auth.php';
require_admin_or_403();      // IP-Whitelist + Session

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');   // Nginx-Bypass falls Proxy davor

set_time_limit(0);
ignore_user_abort(false);
while (ob_get_level() > 0) ob_end_flush();
```

**Loop:**
- Alle 5 Sek. neue Einträge aus `notifications` / `reservations` seit letztem `lastEventId` lesen
- Pro Event: `id: <ts>\nevent: notification\ndata: <json>\n\n` ausgeben + `flush()`
- Heartbeat: alle 20 Sek. `: ping\n\n` damit Proxy nicht trennt
- Max. Laufzeit z. B. 5 Min, dann sauberer Disconnect → Frontend reconnectet automatisch

**Frontend:**
```ts
const es = new EventSource('/sse/notifications.php', { withCredentials: true });
es.addEventListener('notification', (e) => { ... });
es.onerror = () => { /* EventSource reconnectet automatisch */ };
```

**Voraussetzung bei All-Inkl prüfen** (vor Deployment):
- Long-Running PHP-Skripte erlaubt? (manche Tarife killen nach 30s)
- `flush()` funktioniert? (FastCGI-Buffering ggf. via `.htaccess` deaktivieren)
- Falls SSE nicht zuverlässig läuft → Fallback Polling alle 10–15 Sek.

---

## 6. PHPMailer + All-Inkl SMTP

- PHPMailer in `/private/PHPMailer/` ablegen (oder via Composer)
- SMTP-Credentials in `/private/config.php`:
  ```php
  return [
    'smtp' => [
      'host'     => 'w0XXXXXX.kasserver.com',
      'port'     => 465,
      'secure'   => 'ssl',         // TLS implicit
      'username' => 'noreply@deine-domain.de',
      'password' => '...',
      'from'     => ['noreply@deine-domain.de', 'Restaurant Rondo'],
    ],
  ];
  ```
- TLS erzwingen, kein Fallback auf Plain
- Mail-Templates als PHP-Dateien in `/private/mail-templates/` mit `htmlspecialchars()` für alle dynamischen Felder
- Versand-Logs weiterhin in `email_logs`-Tabelle (Status, Zeitpunkt, Empfänger, Typ)
- Bei SMTP-Fehler: Retry max. 2× mit Backoff, dann Fehler loggen

---

## 7. HTTP-Sicherheits-Header

Zentrales Include `/private/lib/headers.php`, in jedem Endpunkt am Anfang:

```php
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'");
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
```

CSP ggf. anpassen, falls externe Schriftarten/Analytics genutzt werden.

---

## 8. .htaccess Härtung

```apache
# HTTPS erzwingen
RewriteEngine On
RewriteCond %{HTTPS} !=on
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Sensible Dateien blockieren
<FilesMatch "\.(env|sql|log|bak|md|json|lock|yml|yaml)$">
  Require all denied
</FilesMatch>

# /private/ niemals erreichbar (zusätzlich zur Position außerhalb Web-Root)
RedirectMatch 403 ^/private(/|$)

# Directory-Listing aus
Options -Indexes

# React SPA-Fallback (alles was nicht /api, /sse, /admin, /cron oder real existierende Datei ist → index.html)
RewriteCond %{REQUEST_URI} !^/(api|sse|admin|cron)/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

---

## 9. Cron-Job: `auto-cancel-overdue`

- All-Inkl KAS → Cronjobs → URL-Aufruf z. B. alle 15 Min
- Endpunkt: `/cron/auto-cancel.php?key=LANGES_RANDOM_TOKEN`
- Token in `config.php`, Vergleich via `hash_equals`
- Bei falschem/fehlendem Token: `HTTP 403`, sonst Job ausführen
- Logging in `/private/logs/cron.log`

---

## 10. Logs & Backups

**PHP-Errors (in `config.php` für Production):**
```php
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', '/private/logs/php-error.log');
error_reporting(E_ALL);
```

**Backups:**
- Täglicher Cron: `mysqldump --single-transaction db_name > /private/backups/db-$(date +%F).sql.gz`
- Retention: letzte 14 Tage behalten, älter automatisch löschen
- Optional zusätzlich All-Inkl-eigenes Backup aktivieren

---

## 11. Postgres → MySQL Schema-Mapping

| Postgres | MySQL |
|---|---|
| `uuid` + `gen_random_uuid()` | `CHAR(36)` + PHP-generiert (`random_bytes(16)` → UUID v4) oder MySQL `UUID()` |
| `jsonb` (`settings.value`) | `JSON` |
| `timestamptz` | `TIMESTAMP` mit `DEFAULT CURRENT_TIMESTAMP` (UTC speichern, App rechnet um) |
| `text[]` | nicht genutzt |
| RLS-Policies | im PHP-Layer als Auth-Checks (Owner-Check, Admin-Check) |
| `app_role` enum | `VARCHAR(20)` + `CHECK (role IN ('admin','user'))` |
| `auth.users` (Supabase) | eigene Tabelle `users (id, email, password_hash, created_at)` |
| Edge Function | PHP-Datei in `/www/api/` |
| Realtime | SSE-Endpunkt + `EventSource` im Frontend |

**Tabellen, die portiert werden müssen:**
- `users` (neu, ersetzt `auth.users`)
- `user_roles`
- `reservations`
- `units`
- `notifications`
- `activity_log`
- `email_logs`
- `login_attempts`
- `rate_limits` (neu)
- `settings`
- `waitlist`

Foreign Keys explizit setzen mit `ON DELETE CASCADE` wo sinnvoll.

---

## 12. Etappenplan (für die spätere Umsetzung)

| # | Etappe | Inhalt |
|---|---|---|
| 1 | **Fundament** | `/private/config.php`, `db.php`, `headers.php`, `auth.php`, `csrf.php`, `rate_limit.php`, `validate.php`, `.htaccess`, MySQL-CREATE-TABLE-Skripte, IP-Whitelist |
| 2 | **Öffentliche API** | `create-reservation.php`, `cancel-reservation.php`, `modify-reservation.php` + Frontend-Anpassung (`fetch` statt Supabase SDK) |
| 3 | **Admin** | `admin-login.php` (Session + IP-Check), `admin-actions.php` (CRUD), AuthContext umbauen auf Session-Cookie |
| 4 | **Extras** | PHPMailer + All-Inkl SMTP, SSE-Endpunkt + EventSource im Dashboard, Cron `auto-cancel.php` |
| 5 | **Deployment** | FTP-Struktur final aufbauen, Test auf All-Inkl, HTTPS-Check, SSE-Verhalten testen, Härtung-Audit (Header, .htaccess, Permissions 644/755) |

---

## Was aktuell unverändert bleibt

- Komplettes Supabase-Setup (Edge Functions, Realtime, Auth, RLS) bleibt aktiv
- Reservierungs-/Stornierungs-/Änderungs-Flow läuft wie zuletzt umgesetzt
- Keine Anpassungen an Frontend-Komponenten oder Edge Functions
- Diese Datei dient ausschließlich als Referenz für die spätere Migration
