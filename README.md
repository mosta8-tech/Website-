# 👕 Klamotten-Tracker

Eine Website zum Tracken von An- und Verkauf von Kleidung (z. B. Vinted, Flohmarkt, Kleinanzeigen).

## Nutzung

Einfach die Datei `index.html` im Browser öffnen — es wird kein Server und keine Installation benötigt.
Alle Daten werden lokal im Browser gespeichert (localStorage) und bleiben beim Neuladen erhalten.

## Funktionen

### Bestellübersicht (Startseite)
- Bestellungen anlegen, bearbeiten und löschen
- Pro Bestellung: Name, Kaufdatum, **Gesamtgewicht** und **Versandkosten**
- Pro Kleidungsstück: Name, Gewicht, Kaufpreis und (optionaler) Verkaufspreis
- **Versandkosten pro Kleidungsstück** werden automatisch anteilig nach Gewicht berechnet:
  `Versandanteil = Gewicht des Teils ÷ Gesamtgewicht × Versandkosten`
  (ohne eingetragenes Gesamtgewicht wird die Summe der Teilgewichte verwendet)
- Verkäufe erfassen mit Verkaufspreis und Verkaufsdatum, jederzeit änderbar oder zurücksetzbar
- Gewinn pro Teil und pro Bestellung: `Verkaufspreis − Kaufpreis − Versandanteil`

### Statistik
- Gewinn **heute**, **diese Woche** (Mo–So), **diesen Monat** und **gesamt** — automatisch berechnet
- Lagerwert der noch nicht verkauften Teile
- Säulendiagramm: **Gewinn der letzten 6 Monate** (mit Tooltip je Monat)
- Monatstabelle mit verkauften Teilen, Umsatz, Kosten und Gewinn

### Datensicherung
- **Export**: alle Daten als JSON-Datei herunterladen
- **Import**: gesicherte Daten wieder einspielen (z. B. auf einem anderen Gerät)

## Hinweise

- Beträge können mit Komma oder Punkt eingegeben werden (`5,95` oder `5.95`)
- Gewichte werden in Gramm eingegeben
- Helles und dunkles Design folgen automatisch der Systemeinstellung
