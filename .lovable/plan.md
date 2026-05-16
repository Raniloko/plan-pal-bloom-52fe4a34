Ich habe die wahrscheinliche Ursache gefunden: Beim Reload kann der Admin-Check bzw. der erste Dashboard-Backend-Aufruf mit einem noch nicht aktualisierten Token starten. Dann wird aktuell zu aggressiv auf `/backstage/login` weitergeleitet bzw. sogar `signOut()` ausgeführt.

Plan:
1. **Auth-Initialisierung stabilisieren**
   - `AuthContext` bekommt einen klaren Initialisierungsablauf: erst lokale Session laden, dann bei „Angemeldet bleiben“ refreshen, erst danach `loading=false`.
   - Während dieses Starts werden `SIGNED_OUT`/leere Zwischenzustände nicht sofort als echter Logout behandelt.
   - Refresh-Fehler werden getrennt behandelt: Netzwerk/temporäre Fehler behalten die gespeicherte Session, echte ungültige Refresh-Tokens räumen sauber auf.

2. **Admin-Check robuster machen**
   - `ProtectedRoute` soll bei einem fehlgeschlagenen Admin-Check nicht sofort auf Login springen, solange die Auth-Session gerade initialisiert/aktualisiert wird.
   - Bei temporären Backend-Fehlern bleibt die Lade-/Fehlerlogik sauber, statt direkt auszuloggen.

3. **Dashboard-Aufruf nicht mehr hart ausloggen**
   - In `OperationalView` wird der automatische `supabase.auth.signOut()` + `window.location.href` bei `fetch_dashboard` entfernt.
   - Stattdessen wird bei 401/Token-Problemen einmal die Session aktualisiert und der Dashboard-Aufruf wiederholt. Nur wenn danach wirklich keine gültige Session mehr existiert, geht es zurück zum Login.

4. **Kurze Diagnose-Logs ergänzen**
   - Konsolenlogs mit `[auth]`/`[admin]` bleiben knapp, damit man beim nächsten Test sieht, ob ein Refresh versucht wurde, ob er erfolgreich war und welcher Schritt ggf. fehlschlägt.

Erwartetes Ergebnis: Mit aktivem „Angemeldet bleiben“ bleibt das Admin Dashboard nach einem Neuladen geöffnet; nur ein wirklich abgelaufener/ungültiger Refresh-Token oder manuelles Abmelden führt zurück zum Login.