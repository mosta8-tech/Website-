# Arbeitskalender 🗓️

Eine kleine Website, um deinen **Arbeitskalender** zu tracken – Kunden verwalten, Termine
planen und für jede Arbeit **Bezahlung** und **Arbeitszeit** erfassen. Der Kalender zeigt den
**Umsatz pro Tag** auf einen Blick.

Die App läuft komplett im Browser. Es wird **kein Server** benötigt; alle Daten werden lokal im
Browser (`localStorage`) gespeichert.

## Starten

Einfach `index.html` im Browser öffnen. Alternativ mit einem lokalen Server:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Funktionen

### Kalender
- Monatsansicht mit **Umsatz pro Tag** (grünes Abzeichen) und Terminanzahl.
- Monats-Kennzahlen oben: **Umsatz**, **Arbeitszeit** und **Termine** im Monat.
- Klick auf einen Tag zeigt alle Termine des Tages und erlaubt es, direkt einen
  Termin für diesen Tag anzulegen.

### Termine
- Termine anlegen, bearbeiten und löschen – mit **Datum**, **Uhrzeit**, **Kunde** und
  optionaler Beschreibung der Arbeit.
- **Minijob-Arbeit** als eigene Art: ohne Kunde, mit Beschreibung, Bezahlung und Arbeitszeit.
  Der Kalender zeigt den Minijob-Verdienst im Monat separat und warnt, wenn die
  Geringfügigkeitsgrenze (603 €/Monat, Stand 2026) überschritten wird.
- Nach der Arbeit können **Bezahlung (€)** und **Arbeitszeit (Std.)** eingetragen werden.
  Termine ohne Eintrag werden als „offen“ markiert.
- Liste gruppiert nach Tag inkl. Tagesumsatz; vergangene Termine ausblendbar.

### Kunden
- Übersicht aller Kunden mit **Name**, **Telefonnummer** (antippbar) und **Adresse**.
- Suche über Name, Telefon und Adresse.
- Pro Kunde: Anzahl der Termine und Gesamtumsatz.

## Projektstruktur

```
index.html        Grundgerüst, Ansichten und Dialoge
css/styles.css    Styling
js/app.js         Logik: Speicherung, Kalender, Rendering
```
