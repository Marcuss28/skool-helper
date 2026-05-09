# project_skool_helper_may2026

**Codeword:** `#SKOOL-HELPER`
**Stand:** 2026-05-09
**Status:** aktiv, Version 0.4.7

## Was ist das?

Marcus' Chrome-Extension `skool-helper`: Sidebar auf skool.com mit
Keyword-Highlighting, Community-Round-Robin, Cross-Community-Feed (7 Tage),
Bookmarks und Markdown-Export. MV3, alles offline, alle Daten in
`chrome.storage`.

Lokales Repo: `D:\unzipped\skool-helper`
Remote: `github.com/Marcuss28/skool-helper`

## Vollständige Doku

Liegt **im Repo** als `SkoolHelper_ProjectKnowledge.md` — dort stehen
Architektur, Storage-Schema, Skool-DOM-Selektoren, Roadmap, Coding-Patterns
und Release-Workflow.

Wenn du in einer neuen Session am Helper arbeitest:
1. Workspace `D:\unzipped\skool-helper` auswählen lassen.
2. `SkoolHelper_ProjectKnowledge.md` lesen.
3. Aktuelles `manifest.json` für Versions-Stand prüfen, `CHANGELOG.md` für
   letzte Änderungen.

## Was zuletzt passiert ist (v0.4.7, Mai 2026)

Performance-Sprint Pfad A:
- Nav-Scan + Visit-Record gedrosselt (nur bei Slug-Wechsel oder alle 10 s)
- Storage-Writes coalesced (2 s Debounce)
- SPA-URL-Hook via pushState/replaceState/popstate statt 1.5 s-Polling
- postHistory Hard-Cap 2.000 Einträge (LRU nach lastSeen)
- Footer-Sekundentimer auf 1 s wenn aktiv (vorher 30 s)
- Skool-Comment-Container (`[class*="CommentItemContainer"]`) aus
  Post-Detection ausgeschlossen — ein Vorgriff auf Pfad C.

## Was offen ist

- **Pfad B (UX, ~1–2 h):** Per-Tab-Toggle, Bookmarks-Counter im Header,
  Suchfeld, JSON-Import/-Export, Tastatur-Shortcuts, Drag-to-Position.
- **Pfad C (Detection-Härtung, ~2 h):** `extractPostData` auf
  `UserNameText`/`TitleText`-Klassen umstellen statt heuristisch erstes
  Heading/Link.
- **Pfad D (Code-Hygiene):** Defaults zentralisieren (3× dupliziert in
  background.js, options.js, content.js).

## Cowork-Session-Referenzen

Diese Session (Pfad A umgesetzt): `local_ea8ee1d7-5a76-40a3-a640-ae11e6f98b76`

Wenn der User `#SKOOL-HELPER` oder "Skool Helper" erwähnt, ist das hier der
Einstieg. ProjectKnowledge im Repo lesen für vollen Kontext.
