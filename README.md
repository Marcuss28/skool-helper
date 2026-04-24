# Skool Helper

Chrome-Extension für Skool-Poweruser: markiert Posts mit deinen Keywords, zeigt welche Communities du heute noch checken solltest, und sammelt interessante Beiträge in einer 7-Tage-Übersicht. Spart pro Tag locker 15 Minuten, wenn du in 5+ Communities aktiv bist. Läuft offline, keine API, keine Auto-Likes &mdash; du bleibst Herr deiner Interaktionen.

## Features

- **Keyword-Highlighting**: Posts mit deinen Schlüsselwörtern bekommen einen goldenen Rahmen und ein Badge im Skool-Feed.
- **Community-Rundlauf**: Sidebar zeigt, welche deiner Communities du heute noch nicht besucht hast (Reset um Mitternacht).
- **Priority-Posts**: Gesammelte Liste aller markierten Posts auf der aktuellen Seite mit Direktsprung und Kommentar-Vorlagen.
- **Cross-Community-Feed (7 Tage)**: Alle Treffer der letzten Woche über alle Communities hinweg in einer Ansicht.
- **Gemerkt (Read-Later)**: One-Click-Bookmark für Posts, spätere Wiederfindung.
- **Ausschluss-Filter**: Keywords und Autoren ausblenden/ausgrauen.
- **Sprachfilter**: Nur deutsche / englische / beliebige Communities im Rundlauf.
- **Mitgliedschafts-Erkennung**: Unterscheidet automatisch deine eigenen Mitgliedschaften von zufälligen Community-Links.
- **Kommentar-Vorlagen**: Schnell kopieren &amp; einfügen, aber immer manuell senden.
- **Tägliche &amp; Wochen-Zusammenfassung**: Markdown-Export der priorisierten Posts.
- **Optional**: Session-Timer und Engagement-Log im Footer.

Alles offline, alle Daten bleiben lokal im Browser-Storage. Kein Tracking, keine API, keine externen Server.

## Installation

1. [Neuestes Release](https://github.com/Marcuss28/skool-helper/releases/latest/download/skool-helper.zip) herunterladen.
2. ZIP entpacken.
3. In Chrome/Edge/Brave: Adressleiste `chrome://extensions` öffnen.
4. **Entwicklermodus** oben rechts einschalten.
5. **Entpackte Erweiterung laden** klicken und den entpackten Ordner auswählen.
6. Extension-Icon erscheint in der Toolbar. Auf skool.com gehen, Sidebar erscheint unten rechts.

## Einstellungen

Klick auf das Extension-Icon &rarr; **Einstellungen öffnen**, oder aus der Sidebar auf das Zahnrad.

- Keywords (eines pro Zeile)
- Kommentar-Vorlagen
- Communities-Liste (mit Sprache &amp; Mitgliedschafts-Status pro Eintrag)
- Ausschluss-Keywords / -Autoren
- Sprachfilter für den Rundlauf
- Anzeige-Extras (Timer, Engagement-Log)
- Zusammenfassungs-Export

## Bekannte Einschränkungen

- Die Post-Erkennung ist heuristisch und basiert auf DOM-Patterns von Skool. Ändert Skool das Layout, kann es bis zur nächsten Version haken &mdash; Issue öffnen, ich schau rein.
- Keine Unterstützung für die Skool-Mobile-App.
- Kein Sync zwischen Geräten (Bookmarks etc. sind pro Browser-Profil lokal).

## Privacy

Die Extension macht **keine** externen Netzwerk-Requests. Alle Daten (Keywords, Communities, Bookmarks, History) liegen ausschließlich in `chrome.storage.sync` und `chrome.storage.local` im Browser. Skool bekommt nicht mit, dass die Extension läuft &mdash; sie liest nur den DOM-Inhalt, den du sowieso siehst, und fügt eine Sidebar hinzu.

## Entwicklung / Contributing

Issues und Pull Requests willkommen.

```
git clone https://github.com/Marcuss28/skool-helper.git
cd skool-helper
# In chrome://extensions "Entpackte Erweiterung laden" und diesen Ordner auswählen
```

## Lizenz

MIT &mdash; siehe [LICENSE](LICENSE).
