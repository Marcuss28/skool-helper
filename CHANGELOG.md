# Changelog

## v0.4.10 (2026-05-09)
- Hygiene: Defaults zentralisiert in `defaults.js` — Single Source of Truth fuer Keywords, Templates und alle Settings-Defaults. Vorher 3x dupliziert in background.js, content.js, options.js.
- Bugfix nebenbei: `chrome.runtime.onInstalled` setzte vorher nur 4 von 10 Default-Keys. Mit der Umstellung auf zentrale Defaults werden jetzt alle gesetzt.

## v0.4.9 (2026-05-09)
- Detection: `extractPostData` nutzt jetzt Skools echte styled-component-Klassen — Author aus `[class*="UserNameText"]`, Title aus `[class*="TitleText"]`. Vorher fiel die Heuristik gelegentlich auf den Community-Link als Author rein.
- Detection: ID-Generierung kennt Skools `?c=<post-id>`-Schema und normalisiert auf `path + ?c=<id>`. Verhindert Duplikate in `postHistory`, wenn derselbe Post mit unterschiedlichen Tracking-Parametern verlinkt wird.
- Detection: Snippet-Cleanup zieht jetzt zusätzlich den Author-Praefix raus, falls er am Anfang des `textContent` klebt.
- Cleanup: Zentrale `SKOOL_SEL`-Konstante fasst alle Skool-Selektoren an einer Stelle zusammen — leichter wartbar, wenn Skool das Markup ändert.

## v0.4.8 (2026-05-09)
- UX: Section-Counter in Sidebar-Headern (Priority-Posts, Alle Treffer, Gemerkt) — sieht man sofort wieviel drin ist.
- UX: Persistente Suchleiste in Bookmarks und Cross-Community-Feed — filtert nach Titel/Autor/Community/Keyword.
- UX: Tastatur-Shortcut Alt+Shift+S togglet die Sidebar global. In `chrome://extensions/shortcuts` anpassbar.
- UX: Backup & Wiederherstellen in den Optionen — komplettes JSON-Export aller Settings, Communities, Bookmarks und 14-Tage-Historie. Import mit Confirm.

## v0.4.7 (2026-05-09)
- Performance: Nav-Scan und Visit-Record nur bei Slug-Wechsel oder alle 10s, nicht pro MutationObserver-Tick.
- Performance: Storage-Writes (Communities, postHistory) coalesced (2s Debounce) — deutlich weniger Schreibzyklen.
- Robustheit: postHistory zusaetzlich auf max. 2000 Eintraege gedeckelt (LRU nach lastSeen).
- Robustheit: SPA-URL-Wechsel via history.pushState/replaceState/popstate-Hook statt 1.5s-Polling — reagiert sofort.
- Bug: Footer-Timer aktualisiert sich jetzt sekuendlich, wenn showTimer aktiv ist (vorher 30s ungenau).
- Bug: Posts-vs-Kommentar-Trennung haerter — Container mit Skool-Klasse `*CommentItemContainer*` werden bei der Post-Detection uebersprungen.
- Cleanup: Versions-Kommentare in content.js und content.css aktualisiert.

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
