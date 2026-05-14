# Warteliste → Reservierung Konvertierung

Ziel: Im Admin-Panel (`/backstage` → Operational View → Tab „Warteliste") soll jeder Eintrag mit einem Klick auf einen neuen Button **„In Reservierung umwandeln"** zu einer echten Reservierung werden. Dabei wird automatisch ein passender freier Tisch im gewünschten Bereich vorgeschlagen, den der Admin per Dropdown noch ändern oder bestätigen kann.

## Ablauf für den Admin

1. Im Tab „Warteliste" erscheint pro Eintrag neben dem bestehenden „Senden"-Button ein neuer Button **„→ Reservierung"** (Gold-Akzent `#c9a84c`).
2. Klick öffnet einen kompakten Dialog `WaitlistConvertDialog` mit:
   - Vorausgefüllten Daten aus dem Wartelisten-Eintrag (Name, Telefon, E-Mail, Datum, Uhrzeit, Bereich, Personenanzahl falls vorhanden — sonst Default 2).
   - **Tisch-Vorschlag**: Liste aller freien Units im Wunschbereich zum Wunsch-Zeitslot, sortiert nach bester Kapazitäts-Passung (kleinste Kapazität ≥ Gästeanzahl zuerst). Der erste Vorschlag ist vorausgewählt.
   - Dropdown zum manuellen Wechseln auf einen anderen freien Tisch.
   - Optional: Personenanzahl anpassbar (15-Min-Slot-Logik bleibt).
3. Klick auf **„Bestätigen"**:
   - Erstellt eine Reservierung (`status = 'confirmed'`, `unit_id` gesetzt).
   - Setzt den Wartelisten-Eintrag auf `status = 'converted'` (neuer Status-Wert).
   - Sendet automatisch die Bestätigungs-E-Mail an den Gast (vorhandene `send-reservation-email`-Function).
   - Schließt Dialog, refresht Reservierungs- und Wartelisten-Liste, Toast „Reservierung erstellt für {Name}".

## Tisch-Verfügbarkeitslogik

Wiederverwendung der bestehenden Kapazitäts-Prüfung aus `admin-actions` / `create-reservation`:
- Lade alle `units` im Wunschbereich.
- Lade alle aktiven Reservierungen am Wunschtag im Bereich.
- Eine Unit ist „frei", wenn im Zeitfenster (Wunschzeit ± `DURATION_MIN`, default 120 Min, Billard 30 Min Buffer) keine andere `confirmed`/`pending`/`checked_in`-Reservierung auf derselben `unit_id` liegt.
- Manuell gesperrte Units (`status != 'free'` aus `units`-Tabelle) werden ausgeschlossen.

## Technische Umsetzung

**Backend** — neue Action in `supabase/functions/admin-actions/index.ts`:

```text
action: "convert_waitlist"
body: { waitlist_id, unit_id, guest_count, reservation_time?, reservation_date? }
→ 1. Auth-Check (admin role wie bestehende actions)
→ 2. Waitlist-Eintrag laden, Pflichtfelder validieren
→ 3. Unit-Verfügbarkeit erneut prüfen (Race-Condition-Schutz)
→ 4. INSERT in reservations (zone aus waitlist.area, occasion = 'Warteliste')
→ 5. UPDATE waitlist SET status = 'converted', notified_at = now()
→ 6. activity_log Eintrag
→ 7. send-reservation-email aufrufen (Bestätigung)
→ 8. Response: { reservation_id }
```

Zusätzlich neue Action `get_available_units` (oder Wiederverwendung vorhandener Logik), die für eine Kombination aus `area + date + time + duration` die Liste freier Units liefert.

**Frontend** — neue/geänderte Dateien:
- `src/components/admin/operational/WaitlistConvertDialog.tsx` (neu): Dialog mit shadcn `Dialog`, Tisch-Dropdown, Gäste-Input, Bestätigen-Button, Loading-State.
- `src/components/admin/operational/ReservationPanel.tsx`: Neuer Button pro Wartelisten-Row, öffnet Dialog mit `entry`-Prop.
- `src/pages/admin/OperationalView.tsx`: Dialog-State (`convertEntry`), nach Erfolg `refreshReservations()` + `refreshWaitlist()`.

**Datenbank**: Keine Schema-Änderung nötig — `waitlist.status` ist `text`, `'converted'` als neuer Wert reicht.

## Edge Cases

- Wenn keine Unit im Bereich frei ist → Dialog zeigt Warnung „Keine freien Tische — bitte Zeit/Bereich anpassen oder manuell überbuchen" + Checkbox „Trotzdem buchen (Überbuchung)".
- Wenn der Gast bereits per `notify_waitlist` benachrichtigt wurde (`status = 'notified'`) → Convert-Button bleibt sichtbar (häufiger Folge-Schritt).
- Wartelisten-Eintrag bereits konvertiert → Button ausgeblendet, Status-Badge zeigt grün „Konvertiert".

## Out of scope

- Keine Änderung an der öffentlichen Wartelisten-Seite.
- Keine automatische Konvertierung (immer Admin-Klick + Bestätigung).
- Keine SMS-Benachrichtigung, nur E-Mail (wie bestehend).
