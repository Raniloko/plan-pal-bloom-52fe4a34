## Ziel

Auf der öffentlichen Reservierungsseite soll ein Bereich (z.B. Podest) **nicht buchbar** sein, sobald an der gewählten Uhrzeit kein einziger Tisch in diesem Bereich frei ist. Bei anderen Uhrzeiten bleibt der Bereich wählbar.

## Aktueller Zustand

Das Verhalten ist im Prinzip schon so:
- Schritt 1 Datum/Uhrzeit: Uhrzeit wird ausgegraut, wenn **alle** Bereiche voll sind (`isTimeFullyBooked`).
- Schritt 2 Bereich: Jeder Bereich-Button wird per `disabled` ausgegraut wenn `booked >= ZONE_CAPACITY[zone]`, mit Hinweis „Belegt um HH:MM. Nächste freie Uhrzeit: …".

**Lücke:** Die Kapazität wird als Konstante (`ZONE_CAPACITY`) genommen — geblockte Tische (units.status = `blocked`) werden nicht abgezogen. Beispiel Podest: 4 Tische konstant. Wenn der Admin 2 davon sperrt, gilt die Zone erst ab 4 Reservierungen als voll, obwohl real nur 2 buchbar wären.

## Änderung

`src/components/RondoReservationSystem.tsx`

1. **Echte Kapazität pro Bereich laden:** beim Datums-Wechsel zusätzlich aus `units` lesen:
   ```ts
   supabase.from("units").select("area, status")
   ```
   Daraus pro Zone die Anzahl Tische mit `status != 'blocked'` zählen → `effectiveCapacity[zone]`. Fallback auf `ZONE_CAPACITY[zone]` wenn keine Units geladen.

2. **`isZoneFullyBooked` umstellen** auf `effectiveCapacity[zone]` statt `ZONE_CAPACITY[zone]`.

3. **`isTimeFullyBooked`** nutzt automatisch die neue Funktion → Uhrzeit wird auch dann gesperrt, wenn alle real verfügbaren Tische aller Bereiche zu dieser Zeit belegt sind.

4. **Bereich-Card Anzeige (Zeile 462–500):** ungebuchten Bereichen unverändert; volle Bereiche bleiben mit Hinweis „Belegt um HH:MM" + nächste freie Uhrzeit ausgegraut. Wenn `effectiveCapacity[zone] === 0` (alle Tische gesperrt): Badge „Aktuell nicht verfügbar" statt „Belegt".

5. **Auto-Reset:** vorhandener Effekt (`if zone wird voll → zone leeren`) bleibt; greift jetzt auch wenn Admin Tische sperrt.

## Was sich NICHT ändert

- Backend (`create-reservation` Edge Function) und `ZONE_CAPACITY` dort bleiben unangetastet; die Frontend-Prüfung verhindert das Drücken des Buttons, die Backend-Prüfung bleibt als Sicherheitsnetz erhalten.
- Billard-Logik (RPC-basiert, 20:00-Cutoff) bleibt wie sie ist.
- Reihenfolge der Schritte und Texte/Layout bleiben gleich.

## Technische Notizen

- Einmaliger zusätzlicher Read auf `units` beim Datum-Wechsel (RLS erlaubt public read auf `units`).
- `effectiveCapacity` in `useMemo` ableiten, damit Rerenders billig bleiben.