# Skool Helper — Project Knowledge

**Codeword:** `#SKOOL-HELPER`
**Letzter Stand:** 2026-05-09, Version 0.4.7
**Repo:** lokal `D:\unzipped\skool-helper`, remote `github.com/Marcuss28/skool-helper`
**Owner:** Marcus Schröder (steppender_baer@gmx.de)

---

## Was das Projekt ist

Chrome-Extension (Manifest V3), die auf `skool.com` eine Sidebar einblendet:
hebt Posts mit konfigurierbaren Keywords hervor, trackt welche Communities du
heute schon besucht hast (Round-Robin), sammelt Treffer 7 Tage in einer
Cross-Community-Übersicht, bietet Bookmarks und Markdown-Export. Alles offline,
keine API-Calls, keine externen Server. Alle Daten in `chrome.storage`.

**Zielnutzer:** Marcus selbst und andere Skool-Power-User mit 5+ Communities,
die täglich Zeit beim Sichten verlieren.

---

## Architektur

Standard MV3-Layout, alles in einem Repo-Root, kein Build-Step:

```
manifest.json           MV3 manifest, host_permissions: skool.com/*
background.js           Service Worker — Defaults beim Install, Notify-Relay,
                        openOptionsPage. Sehr schlank.
content.js              Die ganze Logik. ~1.100 Zeilen, IIFE, läuft auf jeder
                        skool.com-Seite (run_at: document_idle).
content.css             Sidebar-Styles + Match-Highlight.
options.html/css/js     Settings-Page (open_in_tab). Keywords, Templates,
                        Sprachfilter, Ausschlüsse, Export.
popup.html/popup.js     Toolbar-Popup mit "Settings öffnen" + "Sidebar toggle".
icons/                  16/48/128 PNGs.
.github/workflows/      release.yml — automatischer ZIP-Build bei git tag.
```

`content.js` ist der Hauptkampfplatz. Wichtige Sektionen in Reihenfolge:

1. **Idempotenz-Guard** (`window.__SKOOL_HELPER_LOADED__`) — Skool-SPA lädt
   das Script potenziell mehrfach.
2. **State-Objekt** (`state`) — alle Runtime-Daten.
3. **Extension-Health** (`isExtensionAlive`, `markExtensionDead`) — Defensive
   gegen "Extension context invalidated" nach Reload.
4. **Storage-I/O** (`loadConfig`, coalesced `saveCommunities`/`savePostHistory`,
   `saveBookmarks`).
5. **Pruning** (`prunePostHistory`) — 14 Tage Zeit-Cap + 2.000 Stück Hard-Cap.
6. **`chrome.storage.onChanged`-Listener** — reagiert live auf Settings-Wechsel.
7. **Community-Detection** (`currentCommunitySlug`, `currentCommunityName`,
   `recordCurrentVisit`, `scanSkoolNavForCommunities`).
8. **Sprach-Detection** (`detectLanguage`) — html-lang + Heuristik.
9. **Post-Detection** (`findPostContainers`, `extractPostData`, `hashString`)
   — heuristisch, mehrere Strategien.
10. **Scan-Loop** (`scan`, `scheduleScan`, `MutationObserver`).
11. **Sidebar-Rendering** (`ensureSidebar`, `renderSidebar`, `renderRoundRobin`,
    `renderPriorityList`, `renderCrossCommunity`, `renderBookmarks`,
    `renderFooterStats`).
12. **`init`** — orchestriert: load → render → scan → MutationObserver →
    SPA-URL-Hook → Footer-Tick.

---

## Storage-Schema

### `chrome.storage.sync` (Settings, klein, 100 KB Limit)

```js
{
  keywords: ["youtube", "bilder", "videos", "todo", "prompt"],
  commentTemplates: ["Super Beitrag! ...", ...],
  sidebarVisible: true,
  notifyOnMatch: true,
  languageFilter: "all" | "de" | "en" | "de_unknown",
  membersOnly: false,
  excludedKeywords: [],
  excludedAuthors: [],
  showTimer: false,
  showEngagement: false
}
```

### `chrome.storage.local` (Größere Daten, 5 MB)

```js
{
  communities: {
    "<slug>": {
      name: string,
      lastVisit: number,        // ms epoch
      manuallyAdded: boolean,
      isMember: boolean,
      language: "de" | "en" | "other" | undefined,
      languageSource: "manual" | "auto"
    }
  },
  bookmarks: {
    "<post-id>": {
      id, title, author, snippet, url, community, savedAt
    }
  },
  postHistory: {
    "<post-id>": {
      id, title, author, snippet, url, community, communitySlug,
      matchedKeywords, firstSeen, lastSeen
    }
  }
}
```

Post-IDs sind die URL ohne Query-String, oder bei lokal-only `local:<hash>`.

---

## Skool-DOM-Selektoren (Stand 2026-05)

Skool nutzt styled-components mit dem Pattern `styled__NAME-sc-HASH-NUM`. Der
Hash wechselt pro Build, der **Name** ist über lange Zeit stabil.

Bekannte Klassen (per `class*=`-Selektor matchbar):

| Element | Klassen-Substring |
|---|---|
| Post-Detail-Header | `PostDetailHeader` |
| Post-Content-Wrapper | `PostContent` |
| Post-Titel | `TitleText` (ein `<span>` im Detail-View) |
| Post-Body-Absätze | `Paragraph` (in `Wrapper` / `JeZEb`) |
| User-Name (Klartext) | `UserNameText` |
| User-Name-Wrapper | `UserNameWrapper` |
| Post-Datum (Detail) | `DateAndLabelWrapper` |
| Comment-Container | `CommentItemContainer` ← **wichtig: Post-Detection muss diesen ausschließen** |
| Comment-Content | `CommentItemContent` |
| Comment-Bubble | `CommentItemBubble` |
| Comment-Datum | `PostedDate` |
| Comment-Reaktionen | `CommentItemReactions` |
| Like-Count | `LikeCount`, Label `LikeLabel` ("Liked") |
| Comment-Count | `CommentsCount` (Text "49 comments") |
| Avatar-Wrapper | `AvatarWrapper` |
| Vote-Button (Comment) | `VoteButton`, Label `VotesLabel` |

URL-Patterns für Communities und Posts:
- Community-Root: `skool.com/<slug>` (Slug ist `[a-z0-9][a-z0-9-]*`)
- Post-Detail: `skool.com/<community>?c=<post-id>` ODER `skool.com/<community>/-/<post-slug>`
- User-Profil: `skool.com/@<username>?g=<community>`

`RESERVED_SLUGS` in `content.js` filtert Pfade wie `/about`, `/login`, `/explore` etc.

---

## Bekannte Einschränkungen

- Post-Detection ist heuristisch (mehrere Selektor-Strategien parallel).
  Bei Skool-DOM-Wechseln kann es bis zur nächsten Version haken. Robustester
  Anker derzeit: `CommentItemContainer`-Exklusion + Heading-basierte Suche.
- Author-Detection in `extractPostData` greift derzeit `firstLink.textContent`
  als Fallback — kann den Community-Link statt den Autor erwischen. **Pfad C
  fixt das via `UserNameText`-Klasse.**
- Keine Mobile-App-Unterstützung (Mobile-Skool ist eine native App).
- Kein Sync zwischen Geräten — Bookmarks und Communities sind pro
  Browser-Profil.
- `sync`-Storage hat 100 KB Total / 8 KB pro Item — bei extrem vielen
  Comment-Templates oder Keywords irgendwann Grenze.

---

## Roadmap (Stand 2026-05-09)

### Erledigt in v0.4.7

- Performance: Nav-Scan + Visit-Record gedrosselt, Storage-Writes coalesced (2 s),
  SPA-URL-Hook statt Polling, Footer-Timer auf 1 s wenn aktiv.
- Robustheit: postHistory Hard-Cap 2.000 Einträge.
- Detection: `CommentItemContainer`-Exklusion in `findPostContainers` + scan-Loop.

### Pfad B — UX (offen, ~1–2 h Arbeit)

- Per-Tab/Per-URL-Toggle (jetzt nur globales Sidebar-Toggle)
- Bookmarks-Counter im Section-Header (so wie "Noch offen heute (16)")
- Suchfeld in Sidebar für Bookmarks und Cross-Community-Feed
- JSON-Import/-Export für Settings + Bookmarks (Backup/Restore)
- Tastatur-Shortcuts via `commands` API: Alt+S (Sidebar), Alt+B (Bookmark)
- Drag-to-Position / Width-Resize für Sidebar
- Keyword-Match-Score-Sortierung (Posts mit 3 Keywords vor Posts mit 1)

### Pfad C — Detection härten (offen, ~2 h)

Mit den bekannten DOM-Klassen (siehe oben) deutlich einfacher als zuvor:
- `extractPostData`: Author aus `[class*="UserNameText"]` lesen statt `firstLink`
- Title aus `[class*="TitleText"]` lesen statt `firstHeading.textContent`
- Date aus `[class*="DateAndLabelWrapper"]` extrahieren (für künftiges Sort)
- Like/Comment-Counts gezielt via `LikeCount`/`CommentsCount`
- Detail-View-Erkennung: `PostDetailHeader`-Existenz → "wir sind in einer
  Detail-Page" → nur Top-Post indizieren, alle CommentItemContainer ignorieren
  (ist jetzt schon defensiv drin, kann aber zentralisiert werden)

### Pfad D — Code-Hygiene (klein, jederzeit)

- Defaults zentralisieren: `DEFAULTS` ist 3× dupliziert (background, options,
  content). Eine `defaults.js` lösen das, geladen via `importScripts` (worker)
  und `<script src>` (options/popup).
- Versions-Strings in Kommentaren halbautomatisch syncen (Tag-basierter
  Release-Workflow setzt nur `manifest.json`).

---

## Build & Release

`.github/workflows/release.yml` macht beim Pushen eines Git-Tags
(`v*.*.*`) automatisch:
1. ZIP des Repo-Inhalts (ohne `.git`, ohne Workflow-Folder)
2. GitHub-Release mit angehängter `skool-helper.zip`

Lokal entwickeln: `chrome://extensions` → Entwicklermodus → "Entpackte
Erweiterung laden" → Repo-Ordner. Für jede Code-Änderung: in
`chrome://extensions` auf den Reload-Button der Extension klicken, dann
Skool-Tab neu laden.

Release-Schritt:
```bash
# 1. manifest.json + CHANGELOG.md aktualisieren
# 2. Commit
git add manifest.json CHANGELOG.md content.js content.css
git commit -m "v0.4.7"
# 3. Tag + Push
git tag v0.4.7
git push && git push --tags
# 4. GitHub Action baut Release automatisch
```

---

## Coding-Patterns / Stil

Beobachtet aus dem bestehenden Code, fortzuführen bei neuen Edits:

- IIFE-Wrapper mit `"use strict"` am Top.
- Idempotenz-Guard via globalem Flag.
- `state`-Objekt für alle Runtime-Daten, nie einzelne Module-Variablen.
- Storage-Saves via `chrome.storage.local.set` mit Promise (kein Callback).
- Defensive Async-Wrapper: jeder Storage-Aufruf in `try/catch`, "Extension
  context invalidated"-String wird auf `markExtensionDead()` gemappt.
- DOM-Output via Template-Strings + `escapeHtml()` für jeden User-Input.
- IDs: `#skool-helper-sidebar`, Klassen: `sh-*`-Prefix.
- Selektoren bevorzugt `[class*="..."]` für Skool-Klassen (wegen
  styled-components-Hash), eigene Klassen direkt.
- Kommentare in Mischform DE/EN, das ist okay.
- Keine Build-Pipeline, kein TypeScript, kein Bundler — bewusst simpel halten.

---

## Wo Marcus typischerweise hin will, wenn er hier zurückkommt

1. Sidebar funktioniert nicht mehr → vermutlich Skool-DOM-Wechsel → Pfad C
   nochmal durchgehen mit aktuellem HTML.
2. Performance fühlt sich träge an → Profil im DevTools, dann ggf. den
   `MutationObserver`-Debounce-Wert anpassen oder weitere Storage-Writes
   coalescen.
3. Neues Feature → Pfad B oder D, je nach Lust.
4. Release schießen → siehe oben, Tag-basiert.

---

## Verwandte Sessions (lokal in Cowork)

Wenn neue Sessions Kontext brauchen, suchen unter:
- Diese Session: `local_ea8ee1d7-5a76-40a3-a640-ae11e6f98b76` (Mai 2026,
  Pfad-A-Sprint, v0.4.6 → v0.4.7).

Memory-Tag: `#SKOOL-HELPER`
