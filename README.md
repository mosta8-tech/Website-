# 👕 Klamotten-Tracker

Eine Website zum Tracken von An- und Verkauf von Kleidung (z. B. Vinted, Flohmarkt, Kleinanzeigen).

## Nutzung

Die Website läuft unter: **https://mosta8-tech.github.io/Website-/**
(wird bei jedem Push automatisch über GitHub Pages veröffentlicht)

Alternativ kann die Datei `index.html` auch direkt im Browser geöffnet werden.
Alle Daten werden lokal im Browser gespeichert (localStorage) und bleiben beim Schließen und Neuladen erhalten.

## Als App auf dem iPhone installieren

1. Die Website in **Safari** öffnen: https://mosta8-tech.github.io/Website-/
2. Unten auf das **Teilen-Symbol** (Viereck mit Pfeil nach oben) tippen
3. **„Zum Home-Bildschirm“** auswählen und mit **„Hinzufügen“** bestätigen

Die App erscheint dann mit eigenem Icon auf dem Home-Bildschirm, öffnet sich im
Vollbild ohne Browserleiste und funktioniert dank Service Worker auch offline.
Die Daten bleiben auf dem Gerät gespeichert — auch wenn die App geschlossen wird.

**Tipp:** Regelmäßig über den **Export**-Button eine Sicherung der Daten als
JSON-Datei speichern. Die Daten liegen nur auf dem jeweiligen Gerät; mit
Export/Import lassen sie sich sichern oder auf ein anderes Gerät übertragen.

## Funktionen

### Bestellübersicht (Startseite)
- Bestellungen anlegen, bearbeiten und löschen
- Pro Bestellung: Name, Kaufdatum, **Gesamtgewicht** und **Versandkosten**
- Pro Kleidungsstück: Name, Gewicht, Kaufpreis und (optionaler) Verkaufspreis
- **Versandkosten pro Kleidungsstück** werden automatisch anteilig nach Gewicht berechnet:
  `Versandanteil = Gewicht des Teils ÷ Gesamtgewicht × Versandkosten`
  (ohne eingetragenes Gesamtgewicht wird die Summe der Teilgewichte verwendet)
- **Paketstatus** pro Bestellung (🚚 Unterwegs / 📦 Angekommen), direkt auf der Karte umschaltbar
- Verkäufe erfassen mit Verkaufspreis, Verkaufsdatum, **Plattform (Vinted/eBay)** und
  **Account (1–3)**, jederzeit änderbar oder zurücksetzbar
- Gewinn pro Teil und pro Bestellung: `Verkaufspreis − Kaufpreis − Versandanteil`

### Statistik
- Gewinn **heute**, **diese Woche** (Mo–So), **diesen Monat** und **gesamt** — automatisch berechnet
- Lagerwert der noch nicht verkauften Teile und Anzahl der Pakete unterwegs
- Säulendiagramm: **Gewinn der letzten 6 Monate** (mit Tooltip je Monat)
- **Gewinn nach Plattform & Account** (Vinted/eBay, Account 1–3) als Balkendiagramm und Tabelle
- Monatstabelle mit verkauften Teilen, Umsatz, Kosten und Gewinn

### Datensicherung
- **Export**: alle Daten als JSON-Datei herunterladen
- **Import**: gesicherte Daten wieder einspielen (z. B. auf einem anderen Gerät)

## Hinweise

- Beträge können mit Komma oder Punkt eingegeben werden (`5,95` oder `5.95`)
- Gewichte werden in Gramm eingegeben
- Helles und dunkles Design folgen automatisch der Systemeinstellung
