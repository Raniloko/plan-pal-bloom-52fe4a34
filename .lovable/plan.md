# Umzug auf dein eigenes Supabase-Projekt

Ziel: Das Projekt läuft künftig nicht mehr auf der eingebauten Cloud, sondern auf deinem eigenen Supabase-Konto.

Wichtig vorab: Den Wechsel selbst kann nur du auslösen (Projekteinstellungen). Ich kann alles drumherum vorbereiten und danach wieder komplett aufbauen.

## Ablauf

1. **Du legst dein Supabase-Projekt an**
   Auf supabase.com ein Projekt erstellen (Region Frankfurt/EU), Datenbank-Passwort sicher notieren.

2. **Ich sichere alle Daten** (bevor irgendetwas getrennt wird)
   - Tische und Bereiche
   - Alle Reservierungen inkl. Historie
   - Tischsperren
   - Öffnungszeiten und Einstellungen
   - Warteliste, E-Mail-Protokoll, Aktivitätslog
   - Liste der Admin-Konten (E-Mail-Adressen)
   Ergebnis: eine vollständige Sicherungsdatei, die ich dir zusätzlich ablege.

3. **Du trennst die Cloud-Verbindung**
   Projekteinstellungen → Integrationen → Cloud trennen.
   Achtung: Das löscht die bisherigen Daten endgültig – deshalb zwingend erst Schritt 2.

4. **Du verbindest dein Supabase-Projekt**
   Ebenfalls unter Projekteinstellungen, über den Supabase-Connector.

5. **Ich baue alles neu auf**
   - Alle Tabellen, Regeln und Zugriffsrechte neu anlegen
   - Die Buchungslogik (Doppelbuchungs-Schutz, Billard-Automatik, Sperren) wieder einrichten
   - Alle Server-Funktionen erneut veröffentlichen (Reservierung anlegen, Verfügbarkeit, Admin-Aktionen, E-Mail-Versand)
   - Gesicherte Daten aus Schritt 2 einspielen
   - E-Mail-Versand-Schlüssel (Resend) wieder hinterlegen

6. **Admin-Zugänge**
   Passwörter lassen sich nicht mitnehmen. Die Admin-Konten werden mit denselben E-Mail-Adressen neu angelegt, jeder setzt einmalig ein neues Passwort.

7. **Test**
   Kundenreservierung, Billard-Tischwahl, Bestätigungs-E-Mail, Backstage-Login und Tischplan durchklicken.

## Was du bereithalten musst

- Supabase-Projekt (URL, öffentlicher Schlüssel, Service-Schlüssel, DB-Passwort)
- Resend-API-Schlüssel für die E-Mails
- Ein Zeitfenster, in dem keine Reservierungen reinkommen (die Umstellung ist eine kurze Auszeit)

## Technische Details

- Schema: `reservations`, `units`, `unit_blocks`, `waitlist`, `settings`, `user_roles`, `notifications`, `email_logs`, `activity_log`, `login_attempts` inkl. RLS-Policies und GRANTs
- Funktionen: `has_role`, `reserve_atomic`, `reserve_billard_auto`, `update_updated_at_column` + Trigger
- Edge Functions: `create-reservation`, `billard-availability`, `admin-actions`, `send-reservation-email`
- Datenexport per SQL-Dump (Schema + Daten getrennt), Import nach Anbindung
- Auth-Nutzer werden neu angelegt, `user_roles` per E-Mail-Zuordnung neu verknüpft
