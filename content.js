/**
 * Skool Helper – Content Script (v0.7.4)
 *
 * v0.7.4: Bugfix — die gerade geoeffnete Community stand als "noch nie
 *         besucht" im Rundlauf, wenn ihr Eintrag zwischendurch aus dem
 *         Speicher verschwunden war (Reset, Entfernen, Backup-Import).
 *         `maybeRecordVisit` prueft jetzt auch, ob ueberhaupt eine
 *         Besuchszeit vorliegt, statt nur den Slug zu vergleichen.
 * v0.7.3: Bugfix — Skools eigene Footer-Links ("Community" und "Affiliates")
 *         wurden als Communities erfasst und landeten im Rundlauf.
 *         RESERVED_SLUGS um die Systemseiten erweitert; bestehende
 *         Fehleintraege werden beim naechsten Laden automatisch entfernt.
 * v0.7.2: Rundlauf-Listen zeigen ~8 statt 4 Eintraege (nur CSS).
 * v0.7.1: Bugfix Mitgliedschafts-Erkennung — der Besuch einer beliebigen
 *         Community markierte sie als eigene Mitgliedschaft. Dadurch war
 *         der Filter "Nur eigene Mitgliedschaften" wirkungslos und die
 *         Community-Liste lief mit fremden Communities voll. isMember
 *         kommt jetzt nur noch aus dem Nav-Scan, und ein sichtbarer
 *         Beitritts-Button setzt die Markierung aktiv auf "kein Mitglied".
 * v0.7.0: Slots — jede Community bekommt in den Optionen einen Slot:
 *         "fest" (taeglich im Rundlauf), "skim" (erst nach 14 Tagen ohne
 *         Besuch wieder faellig) oder "aus" (nie im Rundlauf). Ohne Wert
 *         verhaelt sich eine Community wie bisher, damit beim Update
 *         nichts stumm verschwindet. Feste Slots stehen im Rundlauf oben,
 *         Badge "F"/"S" zeigt den Slot an.
 * v0.6.2: Robuste Community-Name-Erkennung — `currentCommunityName()` liest
 *         jetzt primaer aus `<meta property="og:title">`, dann aus
 *         `<title>`. Skool setzt beide auf Community-Root zuverlaessig auf
 *         den Community-Namen. Die alte H1-Heuristik bleibt als drittes
 *         Safety-Net. Damit endet die Pollution-Quelle endgueltig: ab jetzt
 *         werden korrekte Namen direkt beim ersten Visit erfasst.
 * v0.6.1: Manuelle Namens-Korrektur — Community-Namen in den Optionen jetzt
 *         direkt editierbar (Inline-Input). Plus "Namen leeren"-Bulk-Reset:
 *         loescht alle Namen, behaelt Besuchshistorie/Sprache/Punkte/
 *         Mitgliedschaft. Naechster Skool-Visit fuellt Namen aus Nav.
 * v0.6.0: Update-Check (opt-in, default an) — Background-Worker prueft 1x
 *         taeglich gegen die GitHub-Releases-API, ob ein neueres Release
 *         verfuegbar ist. Bei Update wird die Versionsnummer im Footer
 *         fett+gelb und klickbar (oeffnet Release-Seite). Per Toggle in
 *         den Options abschaltbar. Neue Permissions: alarms +
 *         host_permission api.github.com.
 * v0.5.3: Versionsnummer sichtbar — im Sidebar-Footer (klein, rechts neben
 *         dem Standardtext) und im Options-Header (neben "Einstellungen").
 *         Liest aus chrome.runtime.getManifest().version, damit nur die
 *         manifest.json bei Releases angefasst werden muss.
 * v0.5.2: Bugfix — Community-Namen wurden auf Detail-/Settings-/Leaderboard-
 *         Seiten mit dem Seitentitel ueberschrieben (Folge: "Change password",
 *         Post-Titel etc. tauchten als Community-Namen im Round-Robin auf).
 *         Fix: Namen nur noch auf der Community-Root-Seite erfassen.
 *         Selbstheilung: Nav-Scan ueberschreibt jetzt aggressiv aus der
 *         zuverlaessigen Skool-Drawer-Komponente, alte falsche Namen
 *         korrigieren sich beim naechsten Skool-Besuch automatisch.
 *         Plus: ?p= URL-Pattern wird jetzt auch als Post-Detail erkannt
 *         (Skool nutzt sowohl ?c= als auch ?p= fuer Post-Detail-URLs).
 * v0.5.1: Polish — Transliterationen (Oeffnen, Loeschen, fuer, naechsten, ...)
 *         in user-sichtbaren Strings durch echte Umlaute ersetzt.
 *         Markdown-Export-Filename transliteriert Umlaute jetzt sauber zu
 *         ue/oe/ae/ss statt sie durch Bindestriche zu zerstoeren.
 * v0.5.0: Gamification — liest Level + Punkte zum naechsten Level pro
 *         Community aus der Leaderboard-Card und zeigt sie als dezentes
 *         Badge im Round-Robin (z. B. "L5 · 332P"). Stand wird gecached und
 *         als veraltet markiert (gestrichelt) wenn aelter als 24 h.
 *         Refresh automatisch bei jedem Besuch der Leaderboard-Seite.
 * v0.4.10: Code-Hygiene (Pfad D) — Defaults zentralisiert in defaults.js
 *          (vorher 3x dupliziert in background.js, content.js, options.js
 *          mit abweichendem Umfang in background.js). Single Source of Truth
 *          via globalThis.SKOOL_HELPER_DEFAULTS.
 * v0.4.9: Detection-Sprint (Pfad C) — extractPostData nutzt jetzt die echten
 *         Skool-styled-component-Klassen (TitleText, UserNameText) statt
 *         Heading/erstes-Link-Heuristik. Damit greift die Author-Erkennung
 *         nicht mehr versehentlich den Community-Link. ID nutzt Skools
 *         `?c=<post-id>`-Parameter fuer eindeutige Post-Identifikation.
 *         Zentrale SKOOL_SEL-Konstante fuer alle Skool-Selektoren.
 * v0.4.8: UX-Sprint (Pfad B) — Section-Counter in Headern, persistente Suchfelder
 *         in Bookmarks und Cross-Community-Feed, Tastatur-Shortcut Alt+Shift+S
 *         fuer Sidebar-Toggle (chrome.commands), JSON-Backup-Export/-Import
 *         in Options.
 * v0.4.7: Performance-Sprint — Nav-Scan/Visit-Record gedrosselt, Storage-Writes
 *         coalesced, SPA-URL-Hook statt Polling, postHistory mit Hard-Cap,
 *         Footer-Timer auf 1s, Comment-Container von Post-Detection ausgeschlossen.
 * v0.4.6: Keyword-Chips Trennung, Sidebar-Fingerprint im postHistory-Pruning.
 * v0.4.5: Dreifache Absicherung gegen Selbst-Scan der Sidebar.
 * v0.4.4: Post-Detection ignoriert die eigene Sidebar.
 * v0.4.3: Community-Name auf Detail-Seiten nicht durch Post-Titel ueberschrieben.
 * v0.4.2: "Noch offen heute (0)" unterscheidet "alle besucht" vs. "gefiltert".
 * v0.4.1: "Heute" beginnt ab Mitternacht (Kalendertag).
 * v0.4.0: Post-History (14 Tage), Cross-Community-Feed (7 Tage), Markdown-Export, Anti-Autoren-Filter.
 * v0.3.0: Read-Later/Bookmarks, Ausschluss-Keywords, Session-Timer, Engagement-Log.
 * v0.2.x: Round-Robin, Sprachfilter, Mitgliedschafts-Erkennung, robustere Post-Erkennung.
 * v0.1.0: Erstes Release.
 */

(() => {
  "use strict";

  if (window.__SKOOL_HELPER_LOADED__) return;
  window.__SKOOL_HELPER_LOADED__ = true;

  // Defaults aus defaults.js (Single Source of Truth, geteilt mit Service
  // Worker und Options Page). defaults.js wird vor content.js geladen
  // (siehe manifest.json content_scripts.js).
  const DEFAULTS = globalThis.SKOOL_HELPER_DEFAULTS;
  if (!DEFAULTS) {
    console.error("[Skool Helper] defaults.js wurde nicht geladen — Extension neu installieren oder manifest.json pruefen.");
    return;
  }
  const DEFAULT_KEYWORDS = DEFAULTS.keywords;
  const DEFAULT_COMMENT_TEMPLATES = DEFAULTS.commentTemplates;
  const VISIT_WINDOW_MS = 24 * 60 * 60 * 1000;
  // Skim-Slots erscheinen erst wieder im Rundlauf, wenn seit dem letzten
  // Besuch so viel Zeit vergangen ist. 14 Tage = der 14-taegige Rhythmus
  // aus der Crawl-Routine.
  const SKIM_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000;
  const RESERVED_SLUGS = new Set([
    "", "about", "login", "signup", "auth", "settings", "password", "notifications",
    "invite", "billing", "explore", "search", "new", "help", "legal", "privacy",
    "terms", "careers", "press", "api", "docs", "blog",
    // v0.7.3: Skools eigene Footer- und Systemseiten. Ohne diese landeten
    // "Community" (skool.com/community) und "Affiliates"
    // (skool.com/affiliate-program) als vermeintliche Communities im
    // Rundlauf — sie stehen im Footer jeder Skool-Seite und wurden vom
    // Link-Scan eingesammelt.
    "community", "affiliates", "affiliate-program", "affiliate", "support",
    "discovery", "pricing", "download", "refer", "students", "games",
    "contact", "jobs", "brand", "security", "status", "sitemap"
  ]);

  const state = {
    keywords: [],
    matchedPostIds: new Set(),
    posts: new Map(),
    sidebarVisible: true,
    commentTemplates: DEFAULT_COMMENT_TEMPLATES.slice(),
    notifyOnMatch: true,
    languageFilter: "all",
    membersOnly: false,
    excludedKeywords: [],
    excludedAuthors: [],
    showTimer: false,
    showEngagement: false,
    bookmarks: {},
    postHistory: {},
    communities: {},
    sessionCounts: {},
    sessionStart: Date.now()
  };

  let __extensionDead = false;
  function isExtensionAlive() {
    if (__extensionDead) return false;
    try {
      return typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }
  function markExtensionDead() {
    if (__extensionDead) return;
    __extensionDead = true;
    try { mo.disconnect(); } catch (e) {}
    console.info("[Skool Helper] Extension wurde reloaded, dieser Content-Script ist stumm. Bitte Skool-Tab neu laden.");
  }

  async function loadConfig() {
    try {
      const sync = await chrome.storage.sync.get(DEFAULTS);
      state.keywords = (sync.keywords || []).map(k => k.toLowerCase().trim()).filter(Boolean);
      state.commentTemplates = Array.isArray(sync.commentTemplates) && sync.commentTemplates.length
        ? sync.commentTemplates
        : DEFAULT_COMMENT_TEMPLATES.slice();
      state.sidebarVisible = sync.sidebarVisible !== false;
      state.notifyOnMatch = sync.notifyOnMatch !== false;
      state.languageFilter = sync.languageFilter || "all";
      state.membersOnly = sync.membersOnly === true;
      state.excludedKeywords = (sync.excludedKeywords || []).map(k => k.toLowerCase().trim()).filter(Boolean);
      state.excludedAuthors = (sync.excludedAuthors || []).map(a => a.toLowerCase().trim()).filter(Boolean);
      state.showTimer = sync.showTimer === true;
      state.showEngagement = sync.showEngagement === true;

      const local = await chrome.storage.local.get({ communities: {}, bookmarks: {}, postHistory: {}, updateInfo: null });
      state.communities = local.communities || {};
      // Selbstheilung (v0.7.3): Slugs, die inzwischen als Skool-Systemseite
      // erkannt sind, aus dem Bestand werfen. Betrifft Eintraege, die aeltere
      // Versionen erfasst haben ("Community", "Affiliates"). Risikolos — das
      // sind keine echten Communities, es geht nichts verloren.
      {
        const muell = Object.keys(state.communities).filter(s => RESERVED_SLUGS.has(s));
        if (muell.length) {
          for (const s of muell) delete state.communities[s];
          saveCommunities();
        }
      }
      state.bookmarks = local.bookmarks || {};
      state.postHistory = local.postHistory || {};
      state.updateInfo = local.updateInfo || null;
      prunePostHistory();
    } catch (err) {
      console.warn("[Skool Helper] Konnte Config nicht laden:", err);
      state.keywords = DEFAULT_KEYWORDS.slice();
      state.commentTemplates = DEFAULT_COMMENT_TEMPLATES.slice();
    }
  }

  // Coalesced Storage-Writes: max. 1 Schreibvorgang pro Schluessel pro 2s.
  // Verhindert Storage-Spam bei jedem MutationObserver-Tick.
  const COALESCE_DELAY_MS = 2000;
  let saveCommunitiesTimer = null;
  let savePostHistoryTimer = null;

  function saveCommunities() {
    if (!isExtensionAlive()) { markExtensionDead(); return; }
    if (saveCommunitiesTimer) return; // schon geplant, neuer Stand wird beim Flush mitgenommen
    saveCommunitiesTimer = setTimeout(async () => {
      saveCommunitiesTimer = null;
      if (!isExtensionAlive()) return;
      try {
        await chrome.storage.local.set({ communities: state.communities });
      } catch (e) {
        if (e && String(e).includes("Extension context invalidated")) {
          markExtensionDead();
        } else {
          console.warn("[Skool Helper] Konnte Communities nicht speichern:", e);
        }
      }
    }, COALESCE_DELAY_MS);
  }


  async function saveBookmarks() {
    if (!isExtensionAlive()) { markExtensionDead(); return; }
    try {
      await chrome.storage.local.set({ bookmarks: state.bookmarks });
    } catch (e) {
      if (e && String(e).includes("Extension context invalidated")) markExtensionDead();
    }
  }

  function toggleBookmark(post) {
    if (!post || !post.id) return;
    if (state.bookmarks[post.id]) {
      delete state.bookmarks[post.id];
    } else {
      state.bookmarks[post.id] = {
        id: post.id,
        title: post.title || "",
        author: post.author || "",
        snippet: post.snippet || "",
        url: post.url || "",
        community: currentCommunityName() || currentCommunitySlug() || "",
        savedAt: Date.now()
      };
    }
    saveBookmarks();
    renderSidebar();
  }

  function savePostHistory() {
    if (!isExtensionAlive()) { markExtensionDead(); return; }
    if (savePostHistoryTimer) return;
    savePostHistoryTimer = setTimeout(async () => {
      savePostHistoryTimer = null;
      if (!isExtensionAlive()) return;
      try {
        await chrome.storage.local.set({ postHistory: state.postHistory });
      } catch (e) {
        if (e && String(e).includes("Extension context invalidated")) markExtensionDead();
      }
    }, COALESCE_DELAY_MS);
  }

  // Hard-Cap: postHistory bleibt bei sehr aktiver Nutzung handhabbar.
  // chrome.storage.local hat 5 MB Limit ohne Permission, dazu kommt die Render-Last.
  const MAX_POST_HISTORY = 2000;

  function prunePostHistory() {
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    let changed = false;
    for (const [id, p] of Object.entries(state.postHistory || {})) {
      const tooOld = (p.firstSeen || 0) < cutoff;
      const title = (p.title || "").toLowerCase();
      const snippet = (p.snippet || "").toLowerCase();
      // Sidebar-Fingerprints: unsere eigenen Labels/Texte
      const looksLikeSidebar =
        title.includes("skool helper") ||
        snippet.includes("community-rundlauf") ||
        snippet.includes("priority-posts") ||
        snippet.includes("youtubebildervideostodoprompt") ||
        snippet.includes("noch offen heute") ||
        snippet.includes("heute besucht");
      if (tooOld || looksLikeSidebar) {
        delete state.postHistory[id];
        changed = true;
      }
    }
    // Hard-Cap nach Zeit-Pruning: aelteste lastSeen rauswerfen.
    const remaining = Object.entries(state.postHistory);
    if (remaining.length > MAX_POST_HISTORY) {
      remaining.sort((a, b) => (b[1].lastSeen || 0) - (a[1].lastSeen || 0));
      for (let i = MAX_POST_HISTORY; i < remaining.length; i++) {
        delete state.postHistory[remaining[i][0]];
      }
      changed = true;
    }
    if (changed) savePostHistory();
  }

  function recordPostToHistory(data) {
    if (!data || !data.id) return;
    const existing = state.postHistory[data.id];
    const now = Date.now();
    state.postHistory[data.id] = {
      id: data.id,
      title: (data.title || "").slice(0, 200),
      author: (data.author || "").slice(0, 100),
      snippet: (data.snippet || "").slice(0, 300),
      url: data.url || "",
      community: currentCommunityName() || currentCommunitySlug() || "",
      communitySlug: currentCommunitySlug() || "",
      matchedKeywords: data.matchedKeywords || [],
      firstSeen: existing ? existing.firstSeen : now,
      lastSeen: now
    };
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
      if (changes.keywords) {
        state.keywords = (changes.keywords.newValue || []).map(k => k.toLowerCase().trim()).filter(Boolean);
        rescan();
      }
      if (changes.commentTemplates) {
        state.commentTemplates = changes.commentTemplates.newValue || DEFAULT_COMMENT_TEMPLATES.slice();
      }
      if (changes.membersOnly !== undefined) {
        state.membersOnly = changes.membersOnly.newValue === true;
        renderRoundRobin();
      }
      if (changes.sidebarVisible !== undefined) {
        state.sidebarVisible = changes.sidebarVisible.newValue !== false;
        toggleSidebar(state.sidebarVisible);
      }
    }
    if (area === "local" && changes.postHistory) {
      state.postHistory = changes.postHistory.newValue || {};
      renderSidebar();
    }
    if (area === "local" && changes.bookmarks) {
      state.bookmarks = changes.bookmarks.newValue || {};
      renderSidebar();
    }
    if (area === "local" && changes.communities) {
      state.communities = changes.communities.newValue || {};
      renderRoundRobin();
    }
    if (area === "local" && changes.updateInfo) {
      state.updateInfo = changes.updateInfo.newValue || null;
      renderFooterStats();
    }
  });

  function currentCommunitySlug() {
    const parts = location.pathname.split("/").filter(Boolean);
    const slug = (parts[0] || "").toLowerCase();
    if (!slug || RESERVED_SLUGS.has(slug)) return null;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return null;
    return slug;
  }

  function currentCommunityName() {
    // 1. <meta property="og:title"> — Skool setzt das auf Community-Root
    //    zuverlaessig auf den Community-Namen. Auf Post-Detail-Seiten waere
    //    der og:title gleich dem Post-Titel; der Aufrufer (recordCurrentVisit)
    //    gated bereits auf Community-Root, also unkritisch.
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      const t = (ogTitle.getAttribute("content") || "").trim();
      if (t && t.length > 0 && t.length < 100) return t;
    }
    // 2. <title>: auf Community-Root ebenfalls nur der Name (kein "X | Y").
    let docTitle = (document.title || "").trim();
    if (docTitle) {
      docTitle = docTitle.split("|")[0].trim();
      docTitle = docTitle.split(/[·•]/)[0].trim();
      if (docTitle && docTitle.length < 100) return docTitle;
    }
    // 3. Fallback: alte Heuristik mit Headings + nav-aria-current.
    //    Mit dem Path-Gating in recordCurrentVisit selten noetig, aber bleibt
    //    als Safety-Net falls ein Skool-Build die meta-Tags mal vergisst.
    const headerCandidates = document.querySelectorAll('h1, h2, [class*="community"] [class*="name"], [class*="community"] h1, nav [aria-current="page"]');
    for (const el of headerCandidates) {
      let t = (el.textContent || "").trim();
      if (!t) continue;
      t = t.split(/[·•|]/)[0].trim();
      t = t.replace(/\s+(Community|Classroom|Calendar|Members|Map|Leaderboards|About|Prompts|Chat|Gold|Erfolge).*$/i, "").trim();
      if (t && t.length > 0 && t.length < 60) return t;
    }
    return null;
  }

  function recordCurrentVisit() {
    const slug = currentCommunitySlug();
    if (!slug) return;
    const entry = state.communities[slug] || { manuallyAdded: false };
    // Namen nur auf der Community-Root-Seite erfassen. Auf Post-Detail-,
    // Settings-, Leaderboard- und sonstigen Sub-Seiten wuerde der erste <h1>
    // den Post-Titel/Seitentitel zeigen — das hatte vor v0.5.2 zu polluteten
    // Community-Namen wie "Change password" gefuehrt.
    const pathParts = location.pathname.split("/").filter(Boolean);
    const isOnCommunityRoot = pathParts.length === 1
      && !/[?&]p=/.test(location.search)
      && !/[?&]c=/.test(location.search);
    if (isOnCommunityRoot) {
      const currentName = currentCommunityName();
      if (currentName) entry.name = currentName;
    }
    if (!entry.name) entry.name = slug;
    entry.lastVisit = Date.now();
    if (!entry.language || entry.languageSource !== "manual") {
      const lang = detectLanguage();
      if (lang) {
        entry.language = lang;
        entry.languageSource = "auto";
      }
    }
    state.communities[slug] = entry;
    saveCommunities();
  }

  function scanSkoolNavForCommunities() {
    const navSelectors = [
      "nav",
      "aside",
      '[role="navigation"]',
      '[class*="drawer" i]',
      '[class*="sidebar" i]',
      '[class*="sidenav" i]',
      '[data-testid*="drawer" i]',
      '[data-testid*="sidebar" i]'
    ];
    const memberSlugs = new Set();
    for (const sel of navSelectors) {
      document.querySelectorAll(sel).forEach(container => {
        container.querySelectorAll('a[href^="/"], a[href*="skool.com/"]').forEach(a => {
          try {
            const url = new URL(a.href, location.origin);
            if (!/(^|\.)skool\.com$/.test(url.hostname)) return;
            const parts = url.pathname.split("/").filter(Boolean);
            if (parts.length !== 1) return;
            const slug = parts[0].toLowerCase();
            if (RESERVED_SLUGS.has(slug) || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) return;
            memberSlugs.add(slug);
          } catch (e) {}
        });
      });
    }

    const links = document.querySelectorAll('a[href^="/"], a[href*="skool.com/"]');
    let added = false;
    links.forEach(a => {
      let href;
      try {
        href = new URL(a.href, location.origin);
      } catch { return; }
      if (!/(^|\.)skool\.com$/.test(href.hostname)) return;
      const parts = href.pathname.split("/").filter(Boolean);
      if (parts.length !== 1) return;
      const slug = parts[0].toLowerCase();
      if (RESERVED_SLUGS.has(slug) || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) return;

      let name = (a.textContent || "").trim().split("\n")[0].slice(0, 60);
      if (!name) {
        const img = a.querySelector("img[alt]");
        if (img && img.alt) name = img.alt.trim().slice(0, 60);
      }
      if (!name) name = slug;

      const existing = state.communities[slug];
      const isMemberNow = memberSlugs.has(slug);
      if (!existing) {
        state.communities[slug] = { name, lastVisit: 0, manuallyAdded: false, isMember: isMemberNow };
        added = true;
      } else {
        // Nav-Namen sind die zuverlaessigste Quelle (kommen aus Skool's
        // eigener Drawer-Komponente). Aggressiv ueberschreiben, damit
        // alte falsche Werte (z. B. Post-Titel aus pre-v0.5.2-Bug) sich
        // automatisch selbst heilen, sobald der User irgendeine Skool-
        // Seite besucht und die Nav geladen ist.
        if (existing.name !== name) { existing.name = name; added = true; }
        if (isMemberNow && existing.isMember !== true) { existing.isMember = true; added = true; }
      }
    });
    // Negatives Signal schlaegt das positive: zeigt die Seite einen
    // Beitritts-Button, ist der Nutzer hier definitiv KEIN Mitglied — auch
    // wenn der Nav-Scan den Slug eingesammelt hat (die Selektoren "nav" und
    // "aside" erfassen auch den Link der gerade geoeffneten fremden
    // Community). Ohne diese Korrektur bliebe die Fehlmarkierung bestehen.
    const currentSlug = currentCommunitySlug();
    if (currentSlug && state.communities[currentSlug] && hasJoinButton()) {
      if (state.communities[currentSlug].isMember !== false) {
        state.communities[currentSlug].isMember = false;
        added = true;
      }
    }
    // Frueher stand hier ein Fallback: "aktuell geoeffnete Community = ist
    // Mitgliedschaft". Das war falsch — jede nur *angeschaute* fremde
    // Community wurde dadurch als Mitgliedschaft markiert (Recherche,
    // Discovery-Suche, geteilte Links). Folge: `membersOnly` filterte
    // praktisch nichts mehr und die Liste lief mit Fremd-Communities voll.
    // isMember kommt jetzt ausschliesslich aus dem Nav-Scan (memberSlugs) —
    // Skools eigener Drawer listet nur echte Mitgliedschaften.
    // Bestehende Falschmarkierungen bereinigt der Button
    // "Mitgliedschaften zuruecksetzen" in den Optionen.
    if (added) saveCommunities();
  }

  /**
   * Erkennt den Beitritts-Button auf Community- und About-Seiten.
   * Skool rendert ihn je nach UI-Sprache als "JOIN GROUP" oder
   * "GRUPPE BEITRETEN". Nur exakte Treffer zaehlen — Fliesstext wie
   * "join our group" in einem Post soll nicht anschlagen.
   */
  function hasJoinButton() {
    const LABELS = new Set(["join group", "gruppe beitreten", "beitreten", "join"]);
    const nodes = document.querySelectorAll("button, a[role='button']");
    for (const n of nodes) {
      const t = (n.textContent || "").trim().toLowerCase();
      if (t.length <= 20 && LABELS.has(t)) return true;
    }
    return false;
  }

  function detectLanguage() {
    // 1) <html lang="...">
    const htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    if (htmlLang.startsWith("de")) return "de";
    if (htmlLang.startsWith("en")) return "en";
    // 2) Heuristik auf Body-Text (Umlaute + haeufige DE-Woerter)
    const sample = (document.body && document.body.innerText || "").slice(0, 5000).toLowerCase();
    if (!sample) return null;
    const deChars = (sample.match(/[äöüß]/g) || []).length;
    const deWords = (sample.match(/\b(und|der|die|das|nicht|ein|eine|ist|für|auch|mit|wird|sind|oder|über|bei)\b/g) || []).length;
    const enWords = (sample.match(/\b(the|and|for|with|that|this|have|from|your|about|which)\b/g) || []).length;
    const deScore = deChars * 2 + deWords;
    if (deScore >= 10 && deScore > enWords * 1.3) return "de";
    if (enWords >= 10 && enWords > deScore * 1.3) return "en";
    return null;
  }

  function findPostContainers() {
    const candidates = new Set();
    const seen = new WeakSet();

    const TIME_PATTERN = /\b(\d+\s?(d|h|m|s|min|mins|sec|hrs?|hours?|minutes?|seconds?|days?|weeks?|months?)(\s+ago)?|(vor\s+\d+)|(gerade eben)|(just now)|(edited))\b/i;

    const isPostLike = (el) => {
      const text = el.textContent || "";
      const hasLikeText = /\b(Like|Liked|Gefällt)\b/i.test(text);
      const hasCommentsText = /\d+\s*(comments?|Kommentare?)/i.test(text);
      const hasPostLink = el.querySelector('a[href*="/post/"], a[href*="/-/"]') !== null;
      const hasAvatar = el.querySelector('img[alt], img[src*="avatar" i], img[src*="profile" i]') !== null;
      const hasAriaLike = el.querySelector('[aria-label*="like" i], [aria-label*="gefäll" i], [aria-label*="react" i]') !== null;
      const hasAriaComment = el.querySelector('[aria-label*="comment" i], [aria-label*="kommentar" i], [aria-label*="reply" i]') !== null;
      const hasHeading = el.querySelector("h1, h2, h3") !== null;
      const hasTimePattern = TIME_PATTERN.test(text);
      const textLen = text.length;

      return (
        (hasLikeText && hasCommentsText) ||
        (hasPostLink && hasHeading && hasAvatar) ||
        (hasAriaLike && hasAriaComment && hasHeading) ||
        (hasPostLink && hasAriaComment && hasHeading) ||
        (hasPostLink && hasAvatar && hasTimePattern && textLen > 40) ||
        (hasAvatar && hasTimePattern && (hasAriaLike || hasAriaComment) && textLen > 40)
      );
    };

    const rectOk = (el) => {
      const rect = el.getBoundingClientRect();
      return rect.height >= 80 && rect.height <= window.innerHeight * 5;
    };

    const considerContainer = (el) => {
      if (!el || seen.has(el)) return;
      if (!rectOk(el)) return;
      if (isPostLike(el)) {
        candidates.add(el);
        seen.add(el);
      }
    };

    document.querySelectorAll("h1, h2, h3").forEach(heading => {
      let el = heading;
      for (let i = 0; i < 15; i++) {
        if (!el || el === document.body) break;
        if (seen.has(el)) break;
        if (isPostLike(el) && rectOk(el)) {
          candidates.add(el);
          seen.add(el);
          break;
        }
        el = el.parentElement;
      }
    });

    document.querySelectorAll('article, [role="article"]').forEach(considerContainer);

    document.querySelectorAll('a[href*="/post/"], a[href*="/-/"]').forEach(a => {
      let el = a;
      for (let i = 0; i < 12; i++) {
        if (!el || el === document.body) break;
        if (seen.has(el)) break;
        if (isPostLike(el) && rectOk(el)) {
          candidates.add(el);
          seen.add(el);
          break;
        }
        el = el.parentElement;
      }
    });

    Array.from(document.querySelectorAll("button, div, span"))
      .filter(n => {
        const t = (n.textContent || "").trim();
        if (!t) return false;
        return /^(Like|Liked|Gefällt mir|Gefällt dir)$/i.test(t.split("\n")[0].trim());
      })
      .forEach(node => {
        let el = node;
        for (let i = 0; i < 15; i++) {
          if (!el || el === document.body) break;
          if (seen.has(el)) break;
          if (isPostLike(el) && rectOk(el)) {
            candidates.add(el);
            seen.add(el);
            break;
          }
          el = el.parentElement;
        }
      });

    const arr = Array.from(candidates).filter(el => {
      if (el.closest("#skool-helper-sidebar")) return false;
      // Skool-spezifisch: Kommentare auf Post-Detail-Seiten haben Klassen wie
      // "styled__CommentItemContainer-..." und sollen NICHT als eigenstaendige
      // Posts indiziert werden. Der Hauptpost selbst ist nicht in einem
      // CommentItemContainer.
      if (el.closest(SKOOL_SEL.commentItem)) return false;
      return true;
    });
    const filtered = arr.filter(a => !arr.some(b => b !== a && b.contains(a)));
    if (window.__SKOOL_HELPER_DEBUG) {
      console.info("[Skool Helper] Gefundene Post-Container:", filtered.length, filtered);
    }
    return filtered;
  }

  // Skool-spezifische Selektoren (styled-components, Klassen-Substrings stabil
  // ueber lange Zeit — Hash-Suffix wechselt pro Build).
  const SKOOL_SEL = {
    title: '[class*="TitleText"]',
    userName: '[class*="UserNameText"]',
    postedDate: '[class*="PostedDate"]',
    dateLabel: '[class*="DateAndLabelWrapper"]',
    detailHeader: '[class*="PostDetailHeader"]',
    commentItem: '[class*="CommentItemContainer"]',
    // Gamification (Leaderboard-Seite): zeigt Level und Punkte zum naechsten
    // Level fuer den eingeloggten User in der jeweiligen Community.
    gamificationProgress: '[class*="GamificationProgress"]',
    pointsToGoWrapper: '[class*="PointsToGoWrapper"]',
    userInfoTitle: '[class*="UserInfoTitle"]'
  };

  function isPostDetailPage() {
    return !!document.querySelector(SKOOL_SEL.detailHeader);
  }

  /**
   * Extrahiert die eigenen Gamification-Daten (Level + Punkte zum naechsten
   * Level) aus der GamificationProgress-Card. Sichtbar nur auf Leaderboard-
   * Seiten (`/<community>/-/leaderboards`). Returns null falls die Card nicht
   * im DOM ist oder die Werte nicht parsbar sind.
   *
   * Beispiel-Output: { level: 5, toNext: 332 }
   */
  function extractMyPoints() {
    const card = document.querySelector(SKOOL_SEL.gamificationProgress);
    if (!card) return null;

    let level = null;
    const titleEl = card.querySelector(SKOOL_SEL.userInfoTitle);
    if (titleEl) {
      const m = (titleEl.textContent || "").match(/Level\s+(\d+)/i);
      if (m) level = parseInt(m[1], 10);
    }

    let toNext = null;
    const ptsEl = card.querySelector(SKOOL_SEL.pointsToGoWrapper);
    if (ptsEl) {
      // Erste Zahl im Wrapper ist die Punkt-Zahl (z. B. "332 points to level up").
      const m = (ptsEl.textContent || "").match(/(\d[\d.,]*)/);
      if (m) toNext = parseInt(m[1].replace(/[^\d]/g, ""), 10);
    }

    if (level === null && toNext === null) return null;
    return { level, toNext };
  }

  function maybeRecordMyPoints() {
    const slug = currentCommunitySlug();
    if (!slug || !state.communities[slug]) return;
    const pts = extractMyPoints();
    if (!pts) return;
    const prev = state.communities[slug].points || {};
    // Nur speichern wenn sich was geaendert hat oder wir noch nichts haben.
    if (prev.level !== pts.level || prev.toNext !== pts.toNext) {
      state.communities[slug].points = {
        level: pts.level,
        toNext: pts.toNext,
        capturedAt: Date.now()
      };
      saveCommunities();
      renderRoundRobin();
    } else if (!prev.capturedAt) {
      // Identische Werte, aber Zeitstempel fehlt — einmalig setzen.
      state.communities[slug].points = { ...prev, capturedAt: Date.now() };
      saveCommunities();
    }
  }

  function extractPostData(el) {
    const rawAll = (el.textContent || "").replace(/\s+/g, " ").trim();

    // Title: zuerst Skool-spezifisch, dann Heading-Fallback, dann Text-Slice.
    let title = "";
    const titleNode = el.querySelector(SKOOL_SEL.title);
    if (titleNode) title = titleNode.textContent.trim();
    if (!title) {
      const firstHeading = el.querySelector("h1, h2, h3");
      if (firstHeading) title = firstHeading.textContent.trim();
    }
    if (!title) {
      const strong = el.querySelector("strong, b");
      if (strong) title = strong.textContent.trim();
    }
    if (!title) title = rawAll.slice(0, 80);

    // Author: Skool-Klasse zuerst — vermeidet, dass der Community-Link
    // (z. B. "News & Talk") faelschlich als Autor erkannt wird.
    let author = "";
    const userNameNode = el.querySelector(SKOOL_SEL.userName);
    if (userNameNode) {
      author = userNameNode.textContent.replace(/\s+/g, " ").trim().slice(0, 60);
    }
    if (!author) {
      const firstHeading = el.querySelector("h1, h2, h3");
      const headingBlock = firstHeading ? firstHeading.closest("header, div") : null;
      const authorScope = headingBlock || el;
      const avatar = authorScope.querySelector('img[alt], img[src*="avatar"], img[src*="profile"]');
      if (avatar) {
        const nearbyLink = avatar.closest("a") || avatar.parentElement?.querySelector("a, span, div");
        if (nearbyLink) author = nearbyLink.textContent.trim().split("\n")[0].slice(0, 60);
      }
    }
    if (!author) {
      const firstLink = el.querySelector("a");
      if (firstLink) author = firstLink.textContent.trim().split("\n")[0].slice(0, 60);
    }

    // Snippet: rawAll ohne Author-Praefix (sonst steht im Snippet "Felix Hoberg
    // 2d News & Talk Verrueckte KI-Geschaeftsideen ..."), und ohne Like-/
    // Comment-Counts am Ende.
    let snippet = rawAll;
    if (author && snippet.startsWith(author)) {
      snippet = snippet.slice(author.length).trim();
    }
    if (title && snippet.includes(title)) {
      snippet = snippet.slice(snippet.indexOf(title) + title.length).trim();
    }
    snippet = snippet.replace(/\s*(Liked|Like|\d+\s*(comments?|Kommentare?))[\s\S]*$/i, "").trim();
    snippet = snippet.slice(0, 240);

    // URL: Post-Link oder aktuelle Detail-URL. Skool nutzt mehrere Schemata
    // fuer Post-Detail-URLs: `/post/<id>`, `/-/<slug>`, `?c=<id>`, `?p=<id>`.
    let url = "";
    const postLink = el.querySelector('a[href*="/post/"], a[href*="/-/"], a[href*="?c="], a[href*="?p="]');
    if (postLink) url = postLink.href;
    if (!url && (
      location.pathname.includes("/post") ||
      location.pathname.includes("/-/") ||
      /[?&]c=/.test(location.search) ||
      /[?&]p=/.test(location.search)
    )) {
      url = location.href;
    }

    // ID-Normalisierung: Skool's Post-Detail-URLs haben den Post-Identifier
    // entweder als `?c=<id>` oder als `?p=<id>`. Wir normalisieren auf
    // `path?c=<id>` bzw. `path?p=<id>` und werfen alle anderen Query-Params
    // raus, damit derselbe Post nie zwei IDs bekommt (z. B. mit Tracking-
    // Parametern dahinter).
    let id;
    if (url) {
      try {
        const u = new URL(url, location.origin);
        const c = u.searchParams.get("c");
        const p = u.searchParams.get("p");
        if (c) id = `${u.origin}${u.pathname}?c=${c}`;
        else if (p) id = `${u.origin}${u.pathname}?p=${p}`;
        else id = url.split("?")[0];
      } catch (e) {
        id = url.split("?")[0];
      }
    } else {
      id = `local:${hashString((title + "|" + author).slice(0, 200))}`;
    }

    const searchText = rawAll.toLowerCase();
    const matchedKeywords = state.keywords.filter(k => searchText.includes(k));

    return { id, el, title, author, snippet, url, matchedKeywords };
  }

  function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(36);
  }

  // Drosselung: Nav-Scan und Visit-Record sind teuer und mussten frueher pro
  // MutationObserver-Tick laufen. Jetzt: Nav-Scan max. alle 10s ODER bei
  // URL-Slug-Wechsel; Visit-Record nur bei Slug-Wechsel.
  const NAV_SCAN_INTERVAL_MS = 10_000;
  let lastNavScanAt = 0;
  let lastNavScanSlug = null;
  let lastVisitSlug = null;

  function maybeScanNav() {
    const slug = currentCommunitySlug();
    const now = Date.now();
    if (slug !== lastNavScanSlug || now - lastNavScanAt > NAV_SCAN_INTERVAL_MS) {
      scanSkoolNavForCommunities();
      lastNavScanSlug = slug;
      lastNavScanAt = now;
    }
  }

  function maybeRecordVisit() {
    const slug = currentCommunitySlug();
    if (!slug) return;
    // Der Slug-Vergleich allein reichte nicht (v0.7.4): Verschwindet der
    // Eintrag aus dem Speicher, waehrend man auf der Seite bleibt — durch
    // "Besuchs-Historie zuruecksetzen", durch "Entfernen" in den Optionen
    // oder durch einen Backup-Import — dann blieb `lastVisitSlug` stehen und
    // der Besuch wurde nie neu registriert. Der Nav-Scan legte die Community
    // gleich darauf mit `lastVisit: 0` wieder an, und sie stand als "noch nie
    // besucht" im Rundlauf, obwohl man sie gerade offen hatte.
    const entry = state.communities[slug];
    if (slug !== lastVisitSlug || !entry || !entry.lastVisit) {
      recordCurrentVisit();
      lastVisitSlug = slug;
    }
  }

  function scan() {
    if (!isExtensionAlive()) { markExtensionDead(); return; }
    // Alte "Posts" entfernen, die in Wahrheit unsere eigene Sidebar sind (aus altem State)
    for (const [id, p] of Array.from(state.posts)) {
      if (p.el && typeof p.el.closest === "function" && p.el.closest("#skool-helper-sidebar")) {
        state.posts.delete(id);
        state.matchedPostIds.delete(id);
      }
    }
    maybeScanNav();
    maybeRecordVisit();
    maybeRecordMyPoints();

    if (!state.keywords.length) {
      renderSidebar();
      return;
    }
    const containers = findPostContainers();
    const newMatchIds = [];
    const currentSlug = currentCommunitySlug();
    if (currentSlug && !state.sessionCounts[currentSlug]) state.sessionCounts[currentSlug] = 0;

    for (const el of containers) {
      if (el && typeof el.closest === "function" && el.closest("#skool-helper-sidebar")) continue;
      if (el && typeof el.closest === "function" && el.closest(SKOOL_SEL.commentItem)) continue;
      const data = extractPostData(el);
      if (!data) continue;

      const txt = (el.textContent || "").toLowerCase();
      const excluded = state.excludedKeywords.length > 0 && state.excludedKeywords.some(k => txt.includes(k));
      if (excluded) {
        el.classList.add("skool-helper-excluded");
        el.classList.remove("skool-helper-match");
        continue;
      } else {
        el.classList.remove("skool-helper-excluded");
      }

      // Anti-Autor Check
      const authorLower = (data.author || "").toLowerCase();
      const authorExcluded = state.excludedAuthors.length > 0 && state.excludedAuthors.some(a => authorLower.includes(a));
      if (authorExcluded) {
        el.classList.add("skool-helper-excluded");
        el.classList.remove("skool-helper-match");
        continue;
      }

      if (data.matchedKeywords.length > 0) {
        el.classList.add("skool-helper-match");
        el.setAttribute("data-skool-helper-id", data.id);
        ensureBadge(el, data.matchedKeywords);
        if (!state.matchedPostIds.has(data.id)) {
          newMatchIds.push(data.id);
          state.matchedPostIds.add(data.id);
          if (currentSlug) state.sessionCounts[currentSlug]++;
        }
        state.posts.set(data.id, data);
        recordPostToHistory(data);
      } else {
        el.classList.remove("skool-helper-match");
      }
    }

    if (newMatchIds.length > 0) savePostHistory();
    renderSidebar();

    if (state.notifyOnMatch && newMatchIds.length > 0 && document.visibilityState !== "visible") {
      chrome.runtime.sendMessage({
        type: "notify",
        title: `Skool Helper: ${newMatchIds.length} neue relevante Posts`,
        message: newMatchIds
          .map(id => state.posts.get(id))
          .filter(Boolean)
          .map(p => `• ${p.title.slice(0, 60)}`)
          .slice(0, 3)
          .join("\n")
      }).catch(() => {});
    }
  }

  function ensureBadge(el, keywords) {
    if (el.querySelector(":scope > .skool-helper-badge")) return;
    const badge = document.createElement("div");
    badge.className = "skool-helper-badge";
    badge.textContent = "⭐ " + keywords.join(", ");
    badge.title = "Match wegen: " + keywords.join(", ");
    const cs = getComputedStyle(el);
    if (cs.position === "static") el.style.position = "relative";
    el.appendChild(badge);
  }

  function rescan() {
    document.querySelectorAll(".skool-helper-match").forEach(e => e.classList.remove("skool-helper-match"));
    document.querySelectorAll(".skool-helper-badge").forEach(e => e.remove());
    state.matchedPostIds.clear();
    state.posts.clear();
    scan();
  }

  let sidebarEl = null;

  function ensureSidebar() {
    if (sidebarEl) return sidebarEl;
    sidebarEl = document.createElement("div");
    sidebarEl.id = "skool-helper-sidebar";
    sidebarEl.innerHTML = `
      <div class="sh-header">
        <strong>Skool Helper</strong>
        <div class="sh-actions">
          <button class="sh-btn" id="sh-settings" title="Einstellungen">⚙</button>
          <button class="sh-btn" id="sh-toggle" title="Sidebar ein-/ausklappen">–</button>
        </div>
      </div>
      <div class="sh-keywords" id="sh-keywords"></div>
      <div class="sh-section sh-rr">
        <div class="sh-section-header" data-target="sh-rr-body">
          <span>🔄 Community-Rundlauf</span>
          <span class="sh-caret">▾</span>
        </div>
        <div class="sh-section-body" id="sh-rr-body"></div>
      </div>
      <div class="sh-section sh-priority">
        <div class="sh-section-header" data-target="sh-list">
          <span>⭐ Priority-Posts <span class="sh-section-count" id="sh-priority-count"></span></span>
          <span class="sh-caret">▾</span>
        </div>
        <div class="sh-section-body" id="sh-list"><div class="sh-empty">Noch keine Treffer. Scrolle durch den Feed.</div></div>
      </div>
      <div class="sh-section sh-cross">
        <div class="sh-section-header" data-target="sh-cross-body">
          <span>🌐 Alle Treffer (7 Tage) <span class="sh-section-count" id="sh-cross-count"></span></span>
          <span class="sh-caret">▸</span>
        </div>
        <div class="sh-section-body" id="sh-cross-body" style="display:none"></div>
      </div>
      <div class="sh-section sh-bookmarks">
        <div class="sh-section-header" data-target="sh-bookmarks-body">
          <span>📌 Gemerkt <span class="sh-section-count" id="sh-bookmarks-count"></span></span>
          <span class="sh-caret">▾</span>
        </div>
        <div class="sh-section-body" id="sh-bookmarks-body"></div>
      </div>
      <div class="sh-footer" id="sh-footer">Keywords &amp; Communities in den Einstellungen</div>
    `;
    document.documentElement.appendChild(sidebarEl);

    sidebarEl.querySelector("#sh-settings").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "open-options" }).catch(() => {});
    });
    sidebarEl.querySelector("#sh-toggle").addEventListener("click", () => {
      const collapsed = sidebarEl.classList.toggle("sh-collapsed");
      sidebarEl.querySelector("#sh-toggle").textContent = collapsed ? "+" : "–";
    });

    sidebarEl.querySelectorAll(".sh-section-header").forEach(h => {
      h.addEventListener("click", () => {
        const target = h.getAttribute("data-target");
        const body = sidebarEl.querySelector("#" + target);
        const caret = h.querySelector(".sh-caret");
        if (!body) return;
        const hidden = body.style.display === "none";
        body.style.display = hidden ? "" : "none";
        if (caret) caret.textContent = hidden ? "▾" : "▸";
      });
    });
    return sidebarEl;
  }

  function toggleSidebar(visible) {
    ensureSidebar();
    sidebarEl.style.display = visible ? "flex" : "none";
  }

  function formatRelativeTime(ts) {
    if (!ts) return "noch nie";
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "gerade eben";
    if (m < 60) return `vor ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `vor ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `vor ${d} ${d === 1 ? "Tag" : "Tagen"}`;
    const w = Math.floor(d / 7);
    return `vor ${w} ${w === 1 ? "Woche" : "Wochen"}`;
  }


  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function renderRoundRobin() {
    if (!sidebarEl) return;
    const body = sidebarEl.querySelector("#sh-rr-body");
    if (!body) return;

    const now = Date.now();
    const slotRank = (c) => {
      const slot = c.slot || "";
      if (slot === "fest") return 0;
      if (slot === "skim") return 2;
      if (slot === "aus") return 3;
      return 1; // unsortiert
    };
    const entries = Object.entries(state.communities || {})
      .map(([slug, c]) => ({ slug, ...c }))
      .sort((a, b) => (slotRank(a) - slotRank(b)) || (a.name || a.slug).localeCompare(b.name || b.slug));

    if (!entries.length) {
      body.innerHTML = '<div class="sh-empty">Noch keine Communities erfasst. Öffne eine deiner Communities, oder pflege sie in den Einstellungen.</div>';
      return;
    }

    function passesLangFilter(c) {
      const f = state.languageFilter || "all";
      if (f === "all") return true;
      if (f === "de") return c.language === "de";
      if (f === "en") return c.language === "en";
      if (f === "de_unknown") return c.language === "de" || !c.language;
      return true;
    }
    function passesMemberFilter(c) {
      if (!state.membersOnly) return true;
      return c.isMember === true;
    }
    /**
     * Slot-Filter — bildet die Crawl-Routine im Rundlauf ab.
     *
     *   "fest"      taeglich im Rundlauf (wie bisher)
     *   "skim"      erst wieder faellig, wenn SKIM_INTERVAL_MS seit dem
     *               letzten Besuch vergangen ist
     *   "aus"       nie im Rundlauf
     *   (kein Wert) wie "fest" — Bestandsverhalten. Ohne diese Regel wuerden
     *               beim Update alle bisherigen Communities stumm verschwinden.
     */
    function passesSlotFilter(c) {
      const slot = c.slot || "";
      if (slot === "aus") return false;
      if (slot === "skim") {
        if (!c.lastVisit) return true;
        return (now - c.lastVisit) >= SKIM_INTERVAL_MS;
      }
      return true;
    }
    const todayThreshold = startOfToday();
    const notToday = entries.filter(c => (!c.lastVisit || c.lastVisit < todayThreshold) && passesLangFilter(c) && passesMemberFilter(c) && passesSlotFilter(c));
    const today = entries.filter(c => c.lastVisit && c.lastVisit >= todayThreshold && passesMemberFilter(c) && (c.slot || "") !== "aus");
    const currentSlug = currentCommunitySlug();

    const STALE_POINTS_MS = 24 * 60 * 60 * 1000;
    const renderPointsBadge = (c) => {
      const p = c.points;
      if (!p) return "";
      const stale = p.capturedAt && (Date.now() - p.capturedAt) > STALE_POINTS_MS;
      const parts = [];
      if (p.level != null) parts.push(`L${p.level}`);
      if (p.toNext != null) parts.push(`${p.toNext}P`);
      if (!parts.length) return "";
      const label = parts.join(" · ");
      const tooltip = `Stand: ${formatRelativeTime(p.capturedAt)}${p.toNext != null ? ` — noch ${p.toNext} Punkte zum nächsten Level` : ""}`;
      return `<span class="sh-rr-points ${stale ? 'sh-rr-points-stale' : ''}" title="${escapeHtml(tooltip)}">${escapeHtml(label)}</span>`;
    };

    const renderSlotBadge = (c) => {
      const slot = c.slot || "";
      if (slot === "fest") return '<span class="sh-rr-slot sh-rr-slot-fest" title="Fester Slot — täglich">F</span>';
      if (slot === "skim") return '<span class="sh-rr-slot sh-rr-slot-skim" title="Skim-Slot — alle 14 Tage">S</span>';
      return "";
    };

    const renderRow = (c, isToday) => {
      const count = state.sessionCounts[c.slug] || 0;
      const isCurrent = c.slug === currentSlug;
      return `
        <a class="sh-rr-row ${isToday ? 'sh-done' : 'sh-todo'} ${isCurrent ? 'sh-current' : ''}"
           href="https://www.skool.com/${encodeURIComponent(c.slug)}"
           data-slug="${escapeHtml(c.slug)}">
          <span class="sh-rr-dot"></span>
          <span class="sh-rr-name" title="${escapeHtml(c.slug)}">${escapeHtml(c.name || c.slug)}</span>
          ${renderSlotBadge(c)}
          ${renderPointsBadge(c)}
          ${count > 0 ? `<span class="sh-rr-count" title="Treffer in dieser Session">${count}</span>` : ""}
          <span class="sh-rr-time">${escapeHtml(formatRelativeTime(c.lastVisit))}</span>
        </a>
      `;
    };

    // Empty-Message: unterscheide "wirklich alle" vs. "nur gefiltert weg".
    let notTodayEmptyMsg;
    if (notToday.length === 0) {
      const anyNotTodayUnfiltered = entries.some(c => !c.lastVisit || c.lastVisit < todayThreshold);
      if (anyNotTodayUnfiltered) {
        notTodayEmptyMsg = '<div class="sh-empty sh-empty-sm">Keine passenden Communities offen. Filter (Sprache/Mitgliedschaft/Slot) blenden weitere aus.</div>';
      } else {
        notTodayEmptyMsg = '<div class="sh-empty sh-empty-sm">🎉 Alle Communities heute schon besucht.</div>';
      }
    } else {
      notTodayEmptyMsg = "";
    }

    body.innerHTML = `
      <div class="sh-rr-group">
        <div class="sh-rr-title">Noch offen heute (${notToday.length})</div>
        <div class="sh-rr-rows">${notToday.length ? notToday.map(c => renderRow(c, false)).join("") : notTodayEmptyMsg}</div>
      </div>
      <div class="sh-rr-group">
        <div class="sh-rr-title">Heute besucht (${today.length})</div>
        <div class="sh-rr-rows">${today.length ? today.map(c => renderRow(c, true)).join("") : '<div class="sh-empty sh-empty-sm">Noch keine heute.</div>'}</div>
      </div>
    `;
  }

  function renderPriorityList() {
    if (!sidebarEl) return;
    const list = sidebarEl.querySelector("#sh-list");
    if (!list) return;
    const posts = Array.from(state.posts.values())
      .filter(p => p.matchedKeywords.length > 0)
      .sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length);

    const countEl = sidebarEl.querySelector("#sh-priority-count");
    if (countEl) countEl.textContent = posts.length ? `(${posts.length})` : "";

    if (!posts.length) {
      list.innerHTML = '<div class="sh-empty">Noch keine Treffer auf dieser Seite. Scrolle durch den Feed, damit mehr Posts geladen werden.</div>';
      return;
    }

    list.innerHTML = posts.map(p => {
      const isBookmarked = !!state.bookmarks[p.id];
      return `
      <div class="sh-item" data-id="${escapeHtml(p.id)}">
        <div class="sh-item-title">${escapeHtml(p.title.slice(0, 100))}</div>
        <div class="sh-item-meta">${escapeHtml(p.author || "")} ${p.matchedKeywords.map(k => `<span class="sh-kw">${escapeHtml(k)}</span>`).join("")}</div>
        <div class="sh-item-snippet">${escapeHtml(p.snippet.slice(0, 140))}…</div>
        <div class="sh-item-actions">
          <button class="sh-btn sh-jump">Zum Post</button>
          <button class="sh-btn sh-suggest">Kommentar-Ideen</button>
          <button class="sh-btn sh-bookmark" title="Merken">${isBookmarked ? "📌 Gemerkt" : "☆ Merken"}</button>
        </div>
        <div class="sh-suggestions" style="display:none"></div>
      </div>
    `;
    }).join("");

    list.querySelectorAll(".sh-item").forEach(item => {
      const id = item.getAttribute("data-id");
      const post = state.posts.get(id);
      if (!post) return;

      item.querySelector(".sh-jump").addEventListener("click", () => {
        if (post.el && post.el.isConnected) {
          post.el.scrollIntoView({ behavior: "smooth", block: "center" });
          post.el.classList.add("skool-helper-pulse");
          setTimeout(() => post.el.classList.remove("skool-helper-pulse"), 1800);
        } else if (post.url) {
          window.open(post.url, "_blank");
        }
      });

      const bmBtn = item.querySelector(".sh-bookmark");
      if (bmBtn) {
        bmBtn.addEventListener("click", () => toggleBookmark(post));
      }

      item.querySelector(".sh-suggest").addEventListener("click", () => {
        const box = item.querySelector(".sh-suggestions");
        if (box.style.display === "none") {
          box.innerHTML = state.commentTemplates
            .map(t => `
              <div class="sh-sugg">
                <div class="sh-sugg-text">${escapeHtml(t)}</div>
                <button class="sh-btn sh-copy">Kopieren</button>
              </div>
            `).join("");
          box.querySelectorAll(".sh-copy").forEach((btn, i) => {
            btn.addEventListener("click", async () => {
              try {
                await navigator.clipboard.writeText(state.commentTemplates[i]);
                btn.textContent = "Kopiert ✓";
                setTimeout(() => (btn.textContent = "Kopieren"), 1200);
              } catch (e) {
                btn.textContent = "Fehler";
              }
            });
          });
          box.style.display = "block";
        } else {
          box.style.display = "none";
        }
      });
    });
  }

  function renderSidebar() {
    ensureSidebar();
    const kwBox = sidebarEl.querySelector("#sh-keywords");
    kwBox.innerHTML = state.keywords.length
      ? state.keywords.map(k => `<span class="sh-chip">${escapeHtml(k)}</span>`).join(" ")
      : '<span class="sh-chip sh-chip-empty">keine Keywords gesetzt</span>';
    renderRoundRobin();
    renderPriorityList();
    renderCrossCommunity();
    renderBookmarks();
    renderFooterStats();
  }

  function renderCrossCommunity() {
    if (!sidebarEl) return;
    const body = sidebarEl.querySelector("#sh-cross-body");
    if (!body) return;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const allItems = Object.values(state.postHistory || {})
      .filter(p => (p.lastSeen || 0) >= cutoff)
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));

    // Lazy-init: persistente Suchleiste + Listen-Container.
    // Nur einmal initialisieren, damit Fokus/Cursor-Position erhalten bleibt.
    let search = body.querySelector(".sh-search");
    let listEl = body.querySelector(".sh-cross-list");
    if (!search) {
      body.innerHTML = '<input type="search" class="sh-search" placeholder="Filtern (Titel/Autor/Community/Keyword)…">' +
                      '<div class="sh-cross-list"></div>';
      search = body.querySelector(".sh-search");
      listEl = body.querySelector(".sh-cross-list");
      search.addEventListener("input", () => renderCrossCommunity());
    }

    const filter = (search.value || "").toLowerCase().trim();
    const filtered = filter
      ? allItems.filter(p => (
          (p.title || "").toLowerCase().includes(filter) ||
          (p.author || "").toLowerCase().includes(filter) ||
          (p.community || "").toLowerCase().includes(filter) ||
          (p.matchedKeywords || []).some(k => k.includes(filter))
        ))
      : allItems;
    const items = filtered.slice(0, 50);

    const countEl = sidebarEl.querySelector("#sh-cross-count");
    if (countEl) countEl.textContent = allItems.length ? `(${allItems.length})` : "";

    if (!items.length) {
      listEl.innerHTML = '<div class="sh-empty sh-empty-sm">' +
        (filter ? "Keine Treffer für deinen Filter." : "Noch keine gespeicherten Treffer. Scrolle durch deine Communities, damit sie erfasst werden.") +
        '</div>';
      return;
    }
    listEl.innerHTML = items.map(p => `
      <div class="sh-cross-item">
        <div class="sh-cross-title">${escapeHtml((p.title || "").slice(0, 80))}</div>
        <div class="sh-cross-meta">${escapeHtml(p.community || "")} · ${escapeHtml(p.author || "")} · ${escapeHtml(formatRelativeTime(p.lastSeen))}</div>
        <div class="sh-cross-kw">${(p.matchedKeywords || []).map(k => `<span class="sh-kw">${escapeHtml(k)}</span>`).join("")}</div>
        ${p.url ? `<a class="sh-btn" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Öffnen</a>` : ""}
      </div>
    `).join("");
  }

  function renderBookmarks() {
    if (!sidebarEl) return;
    const body = sidebarEl.querySelector("#sh-bookmarks-body");
    if (!body) return;

    const allItems = Object.values(state.bookmarks || {})
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

    // Lazy-init: persistente Suchleiste + Listen-Container.
    let search = body.querySelector(".sh-search");
    let listEl = body.querySelector(".sh-bm-list");
    if (allItems.length > 0 && !search) {
      body.innerHTML = '<input type="search" class="sh-search" placeholder="Filtern (Titel/Autor/Community)…">' +
                      '<div class="sh-bm-list"></div>';
      search = body.querySelector(".sh-search");
      listEl = body.querySelector(".sh-bm-list");
      search.addEventListener("input", () => renderBookmarks());
    }

    const countEl = sidebarEl.querySelector("#sh-bookmarks-count");
    if (countEl) countEl.textContent = allItems.length ? `(${allItems.length})` : "";

    if (!allItems.length) {
      body.innerHTML = '<div class="sh-empty sh-empty-sm">Noch nichts gemerkt. Klicke bei einem Priority-Post auf "☆ Merken".</div>';
      return;
    }

    const filter = (search && search.value || "").toLowerCase().trim();
    const items = filter
      ? allItems.filter(b => (
          (b.title || "").toLowerCase().includes(filter) ||
          (b.author || "").toLowerCase().includes(filter) ||
          (b.community || "").toLowerCase().includes(filter)
        ))
      : allItems;

    if (!items.length) {
      listEl.innerHTML = '<div class="sh-empty sh-empty-sm">Keine Treffer für deinen Filter.</div>';
      return;
    }

    listEl.innerHTML = items.map(b => `
      <div class="sh-bm-item" data-id="${escapeHtml(b.id)}">
        <div class="sh-bm-title">${escapeHtml((b.title || "").slice(0, 80))}</div>
        <div class="sh-bm-meta">${escapeHtml(b.community || "")} ${escapeHtml(b.author || "")}</div>
        <div class="sh-bm-actions">
          <a class="sh-btn" href="${escapeHtml(b.url || "#")}" target="_blank" rel="noopener">Öffnen</a>
          <button class="sh-btn sh-bm-del" data-id="${escapeHtml(b.id)}">Löschen</button>
        </div>
      </div>
    `).join("");
    listEl.querySelectorAll(".sh-bm-del").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (id && state.bookmarks[id]) {
          delete state.bookmarks[id];
          saveBookmarks();
          renderSidebar();
        }
      });
    });
  }

  // Versions-String wird einmalig aus manifest.json gelesen und gecached.
  let __versionStr = "";
  try {
    if (chrome.runtime && chrome.runtime.getManifest) {
      __versionStr = "v" + chrome.runtime.getManifest().version;
    }
  } catch (e) {}

  function renderFooterStats() {
    if (!sidebarEl) return;
    const foot = sidebarEl.querySelector("#sh-footer");
    if (!foot) return;
    const parts = [];
    if (state.showTimer) {
      const sec = Math.floor((Date.now() - state.sessionStart) / 1000);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      parts.push(`⏱ ${m}:${String(s).padStart(2, "0")}`);
    }
    if (state.showEngagement) {
      const now = Date.now();
      const todayStart = startOfToday();
      const todayVisited = Object.values(state.communities || {})
        .filter(c => c.lastVisit && c.lastVisit >= todayStart).length;
      const totalMatches = Object.values(state.sessionCounts).reduce((a, b) => a + b, 0);
      parts.push(`${todayVisited} Comm · ${totalMatches} Treffer`);
    }
    const main = parts.length > 0 ? parts.join(" · ") : "Keywords & Communities in den Einstellungen";
    const update = state.updateInfo;
    const hasUpdate = update && update.updateAvailable === true && update.latestVersion;
    if (__versionStr) {
      const versionClass = hasUpdate ? "sh-footer-version sh-footer-version-update" : "sh-footer-version";
      const tooltip = hasUpdate
        ? `Update verfuegbar: v${update.latestVersion} — klicken zum Oeffnen`
        : "Aktuelle Version";
      const versionLabel = hasUpdate ? `${__versionStr} →` : __versionStr;
      const versionMarkup = hasUpdate
        ? `<a class="${versionClass}" href="${escapeHtml(update.url || "")}" target="_blank" rel="noopener" title="${escapeHtml(tooltip)}">${escapeHtml(versionLabel)}</a>`
        : `<span class="${versionClass}" title="${escapeHtml(tooltip)}">${escapeHtml(versionLabel)}</span>`;
      foot.innerHTML = `<span class="sh-footer-main">${escapeHtml(main)}</span> ${versionMarkup}`;
    } else {
      foot.textContent = main;
    }
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  let scanTimer = null;
  function scheduleScan() {
    if (scanTimer) return;
    scanTimer = setTimeout(() => {
      scanTimer = null;
      try { scan(); } catch (e) { console.warn("[Skool Helper] scan error", e); }
    }, 400);
  }

  const mo = new MutationObserver(() => scheduleScan());

  // SPA-URL-Hook: Skool ist Single-Page. Statt 1.5s-Polling patchen wir
  // history.pushState/replaceState und lauschen auf popstate. Reagiert sofort.
  function installSpaUrlHook() {
    const fire = () => {
      try { window.dispatchEvent(new Event("skool-helper-url")); } catch (e) {}
    };
    try {
      const origPush = history.pushState;
      const origReplace = history.replaceState;
      history.pushState = function () {
        const r = origPush.apply(this, arguments);
        fire();
        return r;
      };
      history.replaceState = function () {
        const r = origReplace.apply(this, arguments);
        fire();
        return r;
      };
    } catch (e) {
      console.warn("[Skool Helper] history-Hook fehlgeschlagen:", e);
    }
    window.addEventListener("popstate", fire);
    window.addEventListener("hashchange", fire);
  }

  async function init() {
    await loadConfig();
    ensureSidebar();
    toggleSidebar(state.sidebarVisible);
    scan();
    mo.observe(document.body, { childList: true, subtree: true });

    // SPA-URL-Wechsel: sofortiger Re-Scan statt 1.5s-Polling.
    installSpaUrlHook();
    let lastHref = location.href;
    window.addEventListener("skool-helper-url", () => {
      if (location.href === lastHref) return;
      lastHref = location.href;
      state.sessionCounts = {};
      rescan();
    });

    // Footer-Refresh: 1s wenn Sekunden-Timer aktiv, sonst 30s reichen
    // (Engagement-Log braucht keine sekundengenaue Aktualisierung).
    // Re-scheduled sich selbst mit aktueller Praeferenz, falls der User
    // den Timer in den Optionen toggelt.
    function scheduleFooterTick() {
      if (__extensionDead) return;
      const interval = state.showTimer ? 1000 : 30000;
      setTimeout(() => {
        if (__extensionDead) return;
        if (state.showTimer || state.showEngagement) {
          try { renderFooterStats(); } catch (e) {}
        }
        scheduleFooterTick();
      }, interval);
    }
    scheduleFooterTick();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
