# Changelog

## v0.4.6 (2026-04-23)
- Fix: Keyword-Chips mit Leerzeichen trennen.
- Fix: Auto-Purge leftover postHistory-Eintraege mit Sidebar-Fingerprint.

## v0.4.5
- Fix: Dreifache Absicherung gegen "Extension scannt sich selbst" (Sidebar-Exklusion in findPostContainers, scan-Loop und state.posts-Cleanup).

## v0.4.4
- Fix: Post-Detection ignoriert die eigene Sidebar.

## v0.4.3
- Fix: Community-Name wird auf Post-Detail-Seiten nicht mehr vom Post-Titel ueberschrieben.

## v0.4.2
- Fix: "Noch offen heute (0)"-Message unterscheidet zwischen "wirklich alle besucht" und "durch Filter ausgeblendet".

## v0.4.1
- Fix: "Heute" beginnt ab Mitternacht (Kalendertag), nicht rollend 24h.

## v0.4.0
- Post-History (14 Tage Storage).
- Cross-Community-Feed (7 Tage) in der Sidebar.
- Taegliche & Wochen-Zusammenfassung als Markdown-Export.
- Ausschluss-Autoren (Anti-Autor-Filter).

## v0.3.0
- Read-Later / Bookmark-Sektion in der Sidebar.
- Ausschluss-Keywords (ausgrauen).
- Session-Timer und Engagement-Log im Footer (optional).

## v0.2.8
- Post-Erkennung auch ohne h-Tag (Zeit-Pattern + Avatar).
- Community-Namen saeubern (Separatoren wie "·" abschneiden).

## v0.2.7
- Robustere Post-Erkennung fuer Feed-Layouts ohne "Like"-Text (aria-Labels, Post-Links).

## v0.2.6
- Mitgliedschafts-Erkennung aus Nav/Drawer.
- Filter "Nur Mitgliedschaften".

## v0.2.5
- Absicherung gegen "Extension context invalidated" nach Reload.

## v0.2.4
- Reparatur der Options-Page (Speichern-Button wieder da).
- Auto-Save fuer Filter.

## v0.2.3
- Sprach-Auto-Erkennung (de/en).
- Sprachfilter (alle / nur deutsch / nur englisch / deutsch+unbekannt).

## v0.2.2
- Community-Rundlauf-Label, scrollbare Gruppen.

## v0.2.1
- Heading-basierte Post-Erkennung.
- Saubere Titel- und Snippet-Extraktion.

## v0.2.0
- Community-Rundlauf: Auto-Tracking der Community-Besuche.
- Auto-Erkennung der Communities aus Skools Navigation.
- Session-Counter fuer Keyword-Treffer pro Community.

## v0.1.0
- Erstes Release: Keyword-Highlighting, Priority-Sidebar, Kommentar-Vorlagen, Desktop-Benachrichtigungen.
