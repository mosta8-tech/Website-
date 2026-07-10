# Kleidung Tracker 👕

Eine kleine Website, um den **An- und Verkauf von Kleidung** zu tracken – Bestellungen erfassen,
Versandkosten anteilig verteilen und den Gewinn automatisch pro Tag, Woche, Monat und über die
letzten 6 Monate auswerten.

Die App läuft komplett im Browser. Es wird **kein Server** benötigt; alle Daten werden lokal im
Browser (`localStorage`) gespeichert.

## Starten

Einfach `index.html` im Browser öffnen. Für Datei-Zugriffe ohne Einschränkungen kann auch ein
lokaler Server genutzt werden:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Funktionen

### Bestellübersicht
- Bestellungen anlegen, bearbeiten und löschen.
- Pro Bestellung: **Kaufdatum**, **Gesamtgewicht (g)**, **Versandkosten gesamt (€)** und optionale Bezeichnung.
- Pro Kleidungsstück: **Art**, **Name**, **Gewicht (g)**, **Kaufpreis**, **Verkaufspreis** und **Verkaufsdatum**.
- Kennzahlen oben: Anzahl Bestellungen, Umsatz, realisierter Gewinn, offene Stücke.

### Versandkosten-Verteilung
Die Versandkosten einer Bestellung werden **anteilig nach Gewicht** auf die Kleidungsstücke verteilt:

```
Versand pro Stück = (Gewicht Stück / Gesamtgewicht) × Versandkosten gesamt
Gewinn pro Stück  = Verkaufspreis − Kaufpreis − Versand pro Stück
```

Ein Stück zählt erst als **verkauft** (und damit für den Gewinn), wenn ein Verkaufsdatum und ein
Verkaufspreis gesetzt sind. Ohne Verkaufsdatum bleibt es „offen“.

### Statistik
- Gewinn **heute**, **diese Woche**, **dieser Monat** und **gesamt**.
- Balkendiagramm für den Gewinn der **letzten 6 Monate**.
- Weitere Kennzahlen: Umsatz gesamt, verkaufte/offene Stücke, Ø Gewinn pro Stück.

## Projektstruktur

```
index.html        Grundgerüst, Ansichten und Formular-Vorlage
css/styles.css    Styling (Dark-/Light-Mode automatisch)
js/app.js         Logik: Speicherung, Berechnung, Rendering
```
