
## Sicherheits-Konzept als Markdown-Datei ablegen

Du hast dich für **"erst später, nur Konzept"** entschieden. Ich baue daher **nichts** um, sondern lege das vollständige Migrations- und Sicherheitskonzept als Referenz-Datei im Projekt-Root ab.

### Was passiert

**Eine neue Datei** `MIGRATION_PLAN.md` wird erstellt — sonst keine Code-Änderungen.

### Inhalt der Datei

Das Dokument enthält basierend auf deinen Entscheidungen:

| Bereich | Deine Wahl |
|---|---|
| Start | Konzept dokumentieren, Umbau später |
| Realtime | Server-Sent Events (SSE) |
| Admin-Login | E-Mail + Passwort + IP-Whitelist |
| E-Mail | All-Inkl SMTP via PHPMailer |

**Gliederung:**
1. **Zielarchitektur** — Frontend (React Build) → `/www/api/*.php` → MySQL, mit `/private/` außerhalb Web-Root
2. **Datenbank** — PDO + Prepared Statements, minimale DB-User-Rechte, UTF8MB4
3. **Admin-Login mit IP-Whitelist** — `/private/ip-whitelist.php` als erste Prüfung (403 vor Login-Logik), `password_hash` BCRYPT cost 12, PHP-Sessions mit `httponly`/`secure`/`samesite=Strict`, Brute-Force-Schutz
4. **Öffentliche Endpunkte** — CSRF-Token, Rate-Limiting in MySQL, Honeypot, Whitelist-Validierung, Cancellation-Token nach Nutzung auf NULL
5. **SSE-Endpunkt** — `/sse/notifications.php` mit `EventSource` im Frontend, `flush()`-Voraussetzung bei All-Inkl prüfen, Reconnect-Logik
6. **PHPMailer + All-Inkl SMTP** — SMTP-Credentials in `config.php`, TLS Port 465, Templates mit `htmlspecialchars()`
7. **HTTP-Header** — HSTS, CSP, X-Frame-Options, Referrer-Policy
8. **.htaccess** — HTTPS-Redirect, Schutz für `/private/`/`.env`/`.sql`/`.log`/`.bak`, SPA-Fallback
9. **Cron-Job** — All-Inkl KAS native Cron für `auto-cancel.php` mit Token-Schutz
10. **Logs & Backups** — `display_errors=Off`, Logs nach `/private/logs/`, tägliches `mysqldump`
11. **Postgres → MySQL Schema-Mapping** — `uuid`/`gen_random_uuid()` → `CHAR(36)`/`UUID()`, `jsonb` → `JSON`, `timestamptz` → `TIMESTAMP`, RLS-Policies → PHP Auth-Layer, Enums → `VARCHAR + CHECK`
12. **Etappenplan** für die spätere Umsetzung (Fundament → öffentl. API → Admin → Extras → Deployment)

### Was unverändert bleibt

- Aktuelles Supabase-Setup (Edge Functions, Realtime, Auth) bleibt vollständig aktiv
- Reservierungs-/Stornierungs-/Änderungs-Flow funktioniert wie zuletzt umgesetzt
- Keine Anpassungen an Frontend-Komponenten oder Edge Functions
