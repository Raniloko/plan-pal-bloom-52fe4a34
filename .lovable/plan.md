# Neue Absender-Adresse für Reservierungs-E-Mails

Resend ist schon eingebaut. Kunden bekommen bereits Mails bei Bestätigung, Änderung und Stornierung. Geändert wird nur der Absender.

## Änderung
- Angezeigter Name: **Rondo Sportsbar**
- Neue Adresse: **reservierung@rondo-sportsbar-reservieren.de** (statt info@dev-lab24.de)
- Kunden sehen im Postfach dann: „Rondo Sportsbar <reservierung@rondo-sportsbar-reservieren.de>“

## Was du in Resend machen musst
- Die Domain rondo-sportsbar-reservieren.de in deinem Resend-Konto hinzufügen und bestätigen (DNS-Einträge bei deinem Domain-Anbieter eintragen).
- Solange die Domain nicht bestätigt ist, lehnt Resend den Versand ab. Die Reservierung selbst funktioniert trotzdem, nur die Mail kommt nicht an.

## Danach
- Mail-Funktion neu veröffentlichen
- Eine Testmail über eine Testreservierung auslösen und prüfen, ob sie ankommt

## Technische Details
- `supabase/functions/send-reservation-email/index.ts`: Absender (`from`) über ein optionales Secret `EMAIL_FROM` steuerbar machen, Standardwert `Rondo Sportsbar <reservierung@rondo-sportsbar-reservieren.de>`
- Zusätzlich `APP_URL`-Standardwert auf https://rondo-sportsbar-reservieren.de setzen, damit die Links zum Ändern/Stornieren auf deine Domain zeigen
- Funktion `send-reservation-email` neu deployen, Logs prüfen
