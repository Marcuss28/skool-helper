# Changelog

## v0.7.6 (2026-08-29)
- Bugfix: **Die Spracherkennung las zuerst `<html lang>`.** Das beschreibt die UI-Sprache des Skool-Kontos, nicht die Sprache der Community — Skool liefert dort durchgaengig denselben Wert. Folge: *alle* Communities bekamen dieselbe Sprache (bei englischer Oberflaeche auch die deutschen), und der Sprachfilter "Nur deutsche Communities" liess nichts durch. Jetzt entscheidet der tatsaechliche Seiteninhalt; `<html lang>` ist nur noch Rueckfallebene.
- Bugfix im selben Zug: Die **eigene Sidebar wird aus der Textprobe herausgerechnet.** Ihre Beschriftungen sind durchgehend deutsch ("Community-Rundlauf", "Noch offen heute", "Gemerkt") und haetten jede Seite in Richtung Deutsch gezogen, sobald die Sidebar sichtbar ist — der Fix haette den Fehler sonst nur umgedreht.
- Automatisch erkannte Sprachen korrigieren sich beim naechsten Besuch von selbst. Manuell gesetzte bleiben unangetastet.

## v0.7.5 (2026-08-29)
- Bugfix: **Die Options-Seite aktualisierte die Community-Liste nicht.** Sie wurde nur beim Oeffnen der Seite gelesen. Wer die Optionen in einem Tab offen liess und nebenher auf Skool surfte, sah dauerhaft einen veralteten Stand — im Extremfall "Noch keine Communities erfasst", waehrend die Sidebar bereits vier anzeigte. Jetzt haengt die Liste am `chrome.storage.onChanged`-Listener und zieht live nach.
- Detail: Waehrend man einen Community-Namen editiert, wird bewusst nicht neu gerendert — ein Rerender wuerde Fokus und halbfertige Eingabe verwerfen.
- Gefunden beim Sichten der dritten Videoaufnahme: Der Options-Tab stand seit dem Zuruecksetzen offen und zeigte deshalb eine leere Liste, obwohl vier Communities erfasst waren.

## v0.7.4 (2026-08-29)
- Bugfix: **Die gerade geoeffnete Community stand als "noch nie besucht" unter "Noch offen heute".** `maybeRecordVisit()` verglich nur den Slug mit dem zuletzt erfassten. Verschwand der Eintrag zwischendurch aus dem Speicher — durch "Besuchs-Historie zuruecksetzen", "Entfernen" in den Optionen oder einen Backup-Import — blieb `lastVisitSlug` stehen, der Besuch wurde nie neu registriert, und der Nav-Scan legte die Community gleich darauf mit `lastVisit: 0` wieder an. Sie stand dann im Rundlauf als offen, obwohl sie im Vordergrund lief. Jetzt wird zusaetzlich geprueft, ob ueberhaupt eine Besuchszeit vorliegt.
- Gefunden beim Sichten der zweiten Videoaufnahme.

## v0.7.3 (2026-08-29)
- Bugfix: **Skools eigene Footer-Links wurden als Communities erfasst.** "Community" (`skool.com/community`) und "Affiliates" (`skool.com/affiliate-program`) stehen im Footer jeder Skool-Seite und wurden vom Link-Scan eingesammelt — sie tauchten dann dauerhaft im Rundlauf auf und liessen sich nie "abhaken", weil man sie nie besucht. `RESERVED_SLUGS` um die Systemseiten erweitert (community, affiliates, affiliate-program, support, discovery, pricing, download, refer, students, games, contact, jobs, brand, security, status, sitemap).
- Selbstheilung: Bestehende Fehleintraege werden beim naechsten Laden automatisch aus der Community-Liste entfernt. Risikolos, es sind keine echten Communities.
- Gefunden beim Sichten einer Videoaufnahme — im Rundlauf standen "Affiliates" und "Community" ganz oben unter "Noch offen heute".

## v0.7.2 (2026-08-29)
- UX: Die Zeilen-Listen im Rundlauf zeigen jetzt **rund acht statt vier Eintraege**, bevor gescrollt werden muss (`max-height` 152px auf 300px). Der Rundlauf-Bereich selbst darf zusaetzlich hoeher werden (52vh statt der allgemeinen 36vh); Priority-Posts, Cross-Feed und Gemerkt bleiben unveraendert.
- Hintergrund: Mit den Slots aus v0.7.0 hat sich die Gewichtung umgedreht. "Noch offen heute" ist kurz geworden, "Heute besucht" dafuer lang — und ausgerechnet die lange Liste war nach vier Eintraegen abgeschnitten.

## v0.7.1 (2026-08-29)
- Bugfix: **Mitgliedschafts-Erkennung.** Der Besuch einer beliebigen Community-Seite hat sie als eigene Mitgliedschaft markiert — auch fremde Communities aus Recherche, Discovery-Suche oder geteilten Links. Folge: der Filter "Nur eigene Mitgliedschaften" war praktisch wirkungslos und die Community-Liste lief mit Fremd-Communities voll. `isMember` kommt jetzt ausschliesslich aus dem Nav-Scan; Skools eigener Drawer listet nur echte Mitgliedschaften.
- Bugfix, zweiter Teil: Ein sichtbarer Beitritts-Button ("JOIN GROUP" / "GRUPPE BEITRETEN") setzt die Markierung jetzt aktiv auf *kein* Mitglied. Noetig, weil der Nav-Scan mit den Selektoren `nav`/`aside` auch den Link der gerade geoeffneten fremden Community einsammelt — das Entfernen des alten Fallbacks allein haette den Fehler nicht behoben.
- Options: Neuer Button **"Mitgliedschaften zuruecksetzen"** — entfernt alle `isMember`-Markierungen, behaelt Namen, Besuchshistorie, Sprache, Punkte und Slots. Der Nav-Scan fuellt die Flags ueber die naechsten Skool-Besuche korrekt wieder auf. Bewusst **kein** Auto-Cleanup beim Update: der Nav-Drawer listet nicht in jeder Situation alle Mitgliedschaften, eine Automatik wuerde echte Mitgliedschaften faelschlich auf "kein Mitglied" setzen.

## v0.7.0 (2026-08-29)
- Feature: **Slots pro Community.** In den Optionen bekommt jede Community ein Slot-Dropdown: **Fest** (taeglich im Rundlauf), **Skim** (erscheint erst wieder, wenn 14 Tage seit dem letzten Besuch vergangen sind) oder **Aus** (nie im Rundlauf). Damit bildet der Rundlauf die tatsaechliche Crawl-Routine ab, statt jede je gesehene Community gleich zu gewichten.
- Rundlauf: feste Slots stehen oben, dann Communities ohne Slot, dann faellige Skim-Slots. Badge `F` / `S` zeigt den Slot in der Zeile.
- Kompatibilitaet: Communities **ohne** gesetzten Slot verhalten sich exakt wie bisher (taeglich im Rundlauf). Beim Update verschwindet nichts stumm — der Slot ist eine bewusste Entscheidung pro Community, kein Default.
- "Heute besucht" blendet Communities mit Slot **Aus** ebenfalls aus.
- Options-CSS: das Slot-Dropdown faerbt sich nach Auswahl (gold = fest, grau = skim/aus), damit die Routine in einer langen Liste auf einen Blick lesbar ist.

## v0.6.2 (2026-05-09)
- Detection: `currentCommunityName()` liest jetzt primaer aus `<meta property="og:title">` und `<title>`. Skool setzt beide auf Community-Root-Seiten zuverlaessig auf den korrekten Community-Namen. Vorher haben wir mit Heuristik durch H1/H2 gesucht — was teilweise gut, aber nicht 100% verlaesslich war. Die alte H1-Heuristik bleibt als drittes Safety-Net.
- Damit ist die Pollution-Quelle geschlossen: neue Communities werden ab jetzt direkt mit dem korrekten Namen erfasst. Bestehende falsche Namen aus pre-v0.6.2 koennen mit dem Bulk-Reset aus v0.6.1 ("Nur Namen leeren" in den Optionen) korrigiert werden.

## v0.6.1 (2026-05-09)
- UX: Community-Namen in den Optionen sind jetzt direkt editierbar — Klick aufs Namensfeld, neuer Name eintippen, Enter oder Tab speichert. Escape verwirft.
- UX: Neuer Button "Nur Namen leeren" — loescht alle Community-Namen, behaelt Besuchshistorie, Sprache, Punkte und Mitgliedschafts-Status. Beim naechsten Skool-Besuch werden Namen aus der Skool-Navigation automatisch neu erfasst. Praktisch, falls Namen aus aelteren Versionen polluted sind (z. B. Post-Titel als Community-Name).

## v0.6.0 (2026-05-09)
- Feature: **Update-Check** gegen GitHub Releases API. Einmal taeglich (per `chrome.alarms`) prueft der Background-Worker, ob ein neueres Release verfuegbar ist. Bei Update wird die Versionsnummer in Sidebar-Footer und Options-Header fett+gelb dargestellt und ist klickbar (oeffnet Release-Seite).
- Options: Neuer Abschnitt "Update-Check" mit Toggle (default an) und "Jetzt suchen"-Button fuer manuelle Pruefung.
- Permissions: Neu `alarms` (fuer den taeglichen Check) und `https://api.github.com/*` (fuer den Releases-Endpoint). Chrome wird beim Update einmalig um Bestaetigung der erweiterten Permissions bitten.
- Privacy: README praezisiert — der Update-Check ist die einzige externe Anfrage und kann abgeschaltet werden.

## v0.5.3 (2026-05-09)
- UX: Versionsnummer im Sidebar-Footer (dezent rechts) und im Options-Header (neben "Einstellungen"). Beides liest live aus `manifest.json` ueber `chrome.runtime.getManifest()` — keine doppelte Pflege bei Releases.

## v0.5.2 (2026-05-09)
- Bugfix: Community-Namen wurden auf Detail-, Settings- und Leaderboard-Seiten mit dem Seiten-`<h1>` ueberschrieben. Folge: Eintraege wie "Change password", "GPT 5.5" oder Post-Titel landeten als Community-Namen im Round-Robin. Ab jetzt werden Namen nur noch auf der Community-Root-Seite erfasst.
- Selbstheilung: Nav-Scan ueberschreibt bestehende Namen aktiv aus der zuverlaessigen Skool-Drawer-Komponente. Falsche Namen aus pre-v0.5.2 korrigieren sich beim naechsten Skool-Besuch automatisch — ohne dass der User etwas tun muss.
- Detection: `?p=<id>` URL-Pattern wird jetzt auch als Post-Detail-URL erkannt. Skool nutzt sowohl `?c=` (z. B. Prompt-Piloten) als auch `?p=` (z. B. youtubebede) — beide werden jetzt sauber als Post-IDs normalisiert.

## v0.5.1 (2026-05-09)
- Polish: Echte Umlaute in user-sichtbaren Strings — "Öffnen" statt "Oeffnen", "Löschen" statt "Loeschen", "für deinen Filter" statt "fuer", "Tagesüberblick" / "Wochenüberblick", "übernommen", "überschreiben", "zurückgesetzt", "nächsten Level".
- Fix: Markdown-Export-Dateiname transliteriert Umlaute jetzt zu ue/oe/ae/ss, bevor er sanitized wird. Vorher wurde "Tagesüberblick" zu "tages-berblick", weil das Sanitize-Regex Umlaute mit "-" ersetzt hat.

## v0.5.0 (2026-05-09)
- Feature: **Punkte-zum-naechsten-Level** pro Community im Round-Robin. Beim Besuch einer Leaderboard-Seite (`/<community>/-/leaderboards`) liest der Helper Level und Punkte-zum-naechsten aus der GamificationProgress-Card und cached sie pro Community.
- UX: Dezentes Badge `L5 · 332P` neben dem Community-Namen in der Sidebar. Tooltip zeigt Erfassungszeitpunkt.
- UX: Veraltete Werte (>24h) werden gestrichelt und ausgegraut dargestellt — Erinnerung, mal wieder aufs Leaderboard zu schauen.
- Cleanup: SKOOL_SEL um `gamificationProgress`, `pointsToGoWrapper`, `userInfoTitle` ergaenzt.

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
