## Brauchst du AGBs?

**Kurz: Nicht zwingend gesetzlich vorgeschrieben**, aber **dringend empfohlen**, sobald du Online-Reservierungen entgegennimmst. Sie schaffen Klarheit, schützen dich rechtlich (z.B. bei No-Shows) und sind ein Vertrauenssignal für Gäste.

Da bei dir die Stornierung kostenlos ist und kein Geld fließt, bleibt der Inhalt schlank.

## Was umgesetzt wird

### 1. Neue Seite `/agb`
Eine eigene Seite im Stil von Impressum/Datenschutz mit folgenden Abschnitten:

- **§1 Geltungsbereich** — Diese AGB gelten für alle Online-Reservierungen über die Website der Rondo - Sportsbar.
- **§2 Vertragsschluss** — Reservierung kommt mit Erhalt der Bestätigungs-E-Mail zustande. Reservierung ist unverbindlich und kostenlos.
- **§3 Erforderliche Angaben** — Für die Reservierung sind Name, E-Mail und Telefonnummer Pflicht. Diese Daten werden ausschließlich zur Abwicklung der Reservierung genutzt (Details siehe Datenschutzerklärung).
- **§4 Stornierung & Änderung** — Stornierung und Änderung jederzeit kostenlos möglich, über den Link in der Bestätigungs-E-Mail oder telefonisch. Bitte rechtzeitig stornieren, damit der Tisch freigegeben werden kann.
- **§5 No-Show** — Bei wiederholtem Nichterscheinen ohne Absage behält sich Rondo vor, zukünftige Reservierungen abzulehnen. Reservierter Tisch wird bei Verspätung über 15 Minuten ggf. anderweitig vergeben.
- **§6 Billardtische** — Spezielle Regelung: Tisch wird für gebuchten Zeitraum reserviert. Verlängerung vor Ort nur möglich, wenn der Tisch danach frei ist.
- **§7 Hausrecht** — Rondo behält sich vor, Reservierungen ohne Angabe von Gründen abzulehnen.
- **§8 Haftung** — Standard-Haftungsbegrenzung auf Vorsatz und grobe Fahrlässigkeit.
- **§9 Datenschutz** — Verweis auf Datenschutzerklärung.
- **§10 Schlussbestimmungen** — Anwendbares Recht (deutsches Recht), Salvatorische Klausel, Gerichtsstand Hanau.

### 2. Footer-Link
Im `Footer.tsx` wird "AGB" zwischen "Impressum" und "Datenschutz" verlinkt.

### 3. Pflicht-Checkbox im Reservierungs-Flow
Im letzten Schritt von `RondoReservationSystem.tsx` (Kundendaten-Schritt, wo Name/E-Mail/Telefon eingegeben werden) wird eine Pflicht-Checkbox ergänzt:

> ☐ Ich habe die [AGB](/agb) und [Datenschutzerklärung](/datenschutz) gelesen und akzeptiere diese.

- Checkbox muss gesetzt sein, sonst ist der "Reservieren"-Button deaktiviert.
- State `acceptedTerms: boolean` im Form-State.
- Rein clientseitige Pflicht — keine Speicherung in der Datenbank nötig (in Deutschland reicht das aktive Setzen der Checkbox als Nachweis bei kostenlosen, unverbindlichen Reservierungen).

### 4. Route in `App.tsx`
Neue Route `/agb` ergänzen.

## Technische Details

- Neue Datei: `src/pages/AGB.tsx` (Aufbau parallel zu `Impressum.tsx`)
- Anpassungen: `src/App.tsx`, `src/components/Footer.tsx`, `src/components/RondoReservationSystem.tsx`
- Keine Datenbank-Änderungen
- Texte komplett auf Deutsch, gleiches Styling wie bestehende rechtliche Seiten

## Wichtiger Hinweis

Diese AGBs sind als solide Vorlage gedacht, aber **keine Rechtsberatung**. Für maximale Sicherheit empfehle ich, die fertigen AGBs einmal von einem Anwalt oder über einen AGB-Generator (z.B. IT-Recht Kanzlei, eRecht24) gegenchecken zu lassen — besonders falls später kostenpflichtige Angebote (z.B. Eventbuchungen mit Anzahlung) dazukommen.
