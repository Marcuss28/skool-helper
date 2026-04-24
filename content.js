/**
 * Skool Helper – Content Script (v0.2.8)
 *
 * v0.1: Scan nach Posts, Keyword-Highlighting, Sidebar mit Priority-Liste,
 *       Kommentar-Vorlagen, Desktop-Notifications.
 * v0.2: Community Round-Robin – Auto-Tracking von Community-Besuchen,
 *       Auto-Erkennung der Communities aus der Skool-Navigation,
 *       Session-Counter für Keyword-Treffer pro Community.
 * v0.2.1: Heading-basierte Post-Erkennung (ganzer Post umrahmt),
 *         sauberere Titel- und Snippet-Extraktion.
 * v0.2.2: Community-Rundlauf-Label, scrollbare Gruppen.
 * v0.2.3: Sprach-Auto-Erkennung + Sprachfilter (alle/de/en/de+unbekannt).
 * v0.2.4: Reparatur der Options-Page (Speichern-Button), Auto-Save Filter.
 * v0.2.5: Absicherung gegen 'Extension context invalidated' nach Reload.
 * v0.2.6: Mitgliedschafts-Erkennung aus Nav/Drawer + Filter 'Nur Mitgliedschaften'.
 * v0.2.7: Robustere Post-Erkennung fuer Feed-Layouts ohne Like-Text (aria-Labels, Post-Links).
 * v0.2.8: Post-Erkennung auch ohne h-Tag (Zeit-Pattern + Avatar), Community-Namen saeubern.
 */

(() => {
  "use strict";

  if (window.__SKOOL_HELPER_LOADED__) return;
  window.__SKOOL_HELPER_LOADED__ = true;

  const DEFAULT_KEYWORDS = ["youtube", "bilder", "videos", "todo", "prompt"];
  const DEFAULT_COMMENT_TEMPLATES = [
    "Super Beitrag! Danke fürs Teilen. 🙌",
    "Richtig spannend – da hol ich mir Inspiration.",
    "Starker Input! Probier ich gleich mal aus.",
    "Nice, das passt gerade perfekt zu dem, woran ich arbeite.",
    "Mega, danke für den Prompt/Workflow – notiere ich mir."
  ];
  const VISIT_WINDOW_MS = 24 * 60 * 60 * 1000;
  const RESERVED_SLUGS = new Set([
    "", "about", "login", "signup", "auth", "settings", "password", "notifications",
    "invite", "billing", "explore", "search", "new", "help", "legal", "privacy",
    "terms", "careers", "press", "api", "docs", "blog"
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
      const sync = await chrome.storage.sync.get({
        keywords: DEFAULT_KEYWORDS,
        commentTemplates: DEFAULT_COMMENT_TEMPLATES,
        sidebarVisible: true,
        notifyOnMatch: true,
        languageFilter: "all",
        membersOnly: false,
        excludedKeywords: [],
        excludedAuthors: [],
        showTimer: false,
        showEngagement: false
      });
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

      const local = await chrome.storage.local.get({ communities: {}, bookmarks: {}, postHistory: {} });
      state.communities = local.communities || {};
      state.bookmarks = local.bookmarks || {};
      state.postHistory = local.postHistory || {};
      prunePostHistory();
    } catch (err) {
      console.warn("[Skool Helper] Konnte Config nicht laden:", err);
      state.keywords = DEFAULT_KEYWORDS.slice();
      state.commentTemplates = DEFAULT_COMMENT_TEMPLATES.slice();
    }
  }

  async function saveCommunities() {
    if (!isExtensionAlive()) { markExtensionDead(); return; }
    try {
      await chrome.storage.local.set({ communities: state.communities });
    } catch (e) {
      if (e && String(e).includes("Extension context invalidated")) {
        markExtensionDead();
      } else {
        console.warn("[Skool Helper] Konnte Communities nicht speichern:", e);
      }
    }
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

  async function savePostHistory() {
    if (!isExtensionAlive()) { markExtensionDead(); return; }
    try {
      await chrome.storage.local.set({ postHistory: state.postHistory });
    } catch (e) {
      if (e && String(e).includes("Extension context invalidated")) markExtensionDead();
    }
  }

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
  });

  function currentCommunitySlug() {
    const parts = location.pathname.split("/").filter(Boolean);
    const slug = (parts[0] || "").toLowerCase();
    if (!slug || RESERVED_SLUGS.has(slug)) return null;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return null;
    return slug;
  }

  function currentCommunityName() {
    const headerCandidates = document.querySelectorAll('h1, h2, [class*="community"] [class*="name"], [class*="community"] h1, nav [aria-current="page"]');
    for (const el of headerCandidates) {
      let t = (el.textContent || "").trim();
      if (!t) continue;
      t = t.split(/[·•|]/)[0].trim();
      t = t.replace(/\s+(Community|Classroom|Calendar|Members|Map|Leaderboards|About|Prompts|Chat|Gold|Erfolge).*$/i, "").trim();
      if (t && t.length > 0 && t.length < 60) return t;
    }
    let title = (document.title || "").split("|")[0].trim();
    title = title.split(/[·•]/)[0].trim();
    if (title) return title;
    return null;
  }

  function recordCurrentVisit() {
    const slug = currentCommunitySlug();
    if (!slug) return;
    const entry = state.communities[slug] || { manuallyAdded: false };
    // Nur Namen aktualisieren, wenn wir NICHT auf einer Post-Detail-Seite sind
    // (sonst grabben wir den Post-Titel statt den Community-Namen).
    const isPostDetail = /\/post\//.test(location.pathname) || /\/-\//.test(location.pathname);
    const currentName = currentCommunityName();
    const alreadyHasRealName = entry.name && entry.name !== slug;
    if (currentName && (!isPostDetail || !alreadyHasRealName)) {
      entry.name = currentName;
    } else if (!entry.name) {
      entry.name = slug;
    }
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
        if (!existing.name || existing.name === slug) { existing.name = name; added = true; }
        if (isMemberNow && existing.isMember !== true) { existing.isMember = true; added = true; }
      }
    });
    const currentSlug = currentCommunitySlug();
    if (currentSlug && state.communities[currentSlug] && !state.communities[currentSlug].isMember) {
      state.communities[currentSlug].isMember = true;
      added = true;
    }
    if (added) saveCommunities();
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

    const arr = Array.from(candidates).filter(el => !el.closest("#skool-helper-sidebar"));
    const filtered = arr.filter(a => !arr.some(b => b !== a && b.contains(a)));
    if (window.__SKOOL_HELPER_DEBUG) {
      console.info("[Skool Helper] Gefundene Post-Container:", filtered.length, filtered);
    }
    return filtered;
  }

  function extractPostData(el) {
    const rawAll = (el.textContent || "").replace(/\s+/g, " ").trim();

    let title = "";
    const firstHeading = el.querySelector("h1, h2, h3");
    if (firstHeading) title = firstHeading.textContent.trim();
    if (!title) {
      const strong = el.querySelector("strong, b");
      if (strong) title = strong.textContent.trim();
    }
    if (!title) title = rawAll.slice(0, 80);

    let snippet = rawAll;
    if (title && rawAll.includes(title)) {
      snippet = rawAll.slice(rawAll.indexOf(title) + title.length).trim();
    }
    snippet = snippet.replace(/\s*(Liked|Like|\d+\s*(comments?|Kommentare?))[\s\S]*$/i, "").trim();
    snippet = snippet.slice(0, 240);

    let author = "";
    const headingBlock = firstHeading ? firstHeading.closest("header, div") : null;
    const authorScope = headingBlock || el;
    const avatar = authorScope.querySelector('img[alt], img[src*="avatar"], img[src*="profile"]');
    if (avatar) {
      const nearbyLink = avatar.closest("a") || avatar.parentElement?.querySelector("a, span, div");
      if (nearbyLink) author = nearbyLink.textContent.trim().split("\n")[0].slice(0, 60);
    }
    if (!author) {
      const firstLink = el.querySelector("a");
      if (firstLink) author = firstLink.textContent.trim().split("\n")[0].slice(0, 60);
    }

    let url = "";
    const postLink = el.querySelector('a[href*="/post/"], a[href*="/-/"]');
    if (postLink) url = postLink.href;
    if (!url) {
      if (location.pathname.includes("/post") || location.pathname.includes("/-/")) {
        url = location.href;
      }
    }

    const id = url
      ? url.split("?")[0]
      : `local:${hashString((title + "|" + author).slice(0, 200))}`;

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

  function scan() {
    if (!isExtensionAlive()) { markExtensionDead(); return; }
    // Alte "Posts" entfernen, die in Wahrheit unsere eigene Sidebar sind (aus altem State)
    for (const [id, p] of Array.from(state.posts)) {
      if (p.el && typeof p.el.closest === "function" && p.el.closest("#skool-helper-sidebar")) {
        state.posts.delete(id);
        state.matchedPostIds.delete(id);
      }
    }
    scanSkoolNavForCommunities();
    recordCurrentVisit();

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
          <span>⭐ Priority-Posts</span>
          <span class="sh-caret">▾</span>
        </div>
        <div class="sh-section-body" id="sh-list"><div class="sh-empty">Noch keine Treffer. Scrolle durch den Feed.</div></div>
      </div>
      <div class="sh-section sh-cross">
        <div class="sh-section-header" data-target="sh-cross-body">
          <span>🌐 Alle Treffer (7 Tage)</span>
          <span class="sh-caret">▸</span>
        </div>
        <div class="sh-section-body" id="sh-cross-body" style="display:none"></div>
      </div>
      <div class="sh-section sh-bookmarks">
        <div class="sh-section-header" data-target="sh-bookmarks-body">
          <span>📌 Gemerkt</span>
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
    const entries = Object.entries(state.communities || {})
      .map(([slug, c]) => ({ slug, ...c }))
      .sort((a, b) => (a.name || a.slug).localeCompare(b.name || b.slug));

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
    const todayThreshold = startOfToday();
    const notToday = entries.filter(c => (!c.lastVisit || c.lastVisit < todayThreshold) && passesLangFilter(c) && passesMemberFilter(c));
    const today = entries.filter(c => c.lastVisit && c.lastVisit >= todayThreshold && passesMemberFilter(c));
    const currentSlug = currentCommunitySlug();

    const renderRow = (c, isToday) => {
      const count = state.sessionCounts[c.slug] || 0;
      const isCurrent = c.slug === currentSlug;
      return `
        <a class="sh-rr-row ${isToday ? 'sh-done' : 'sh-todo'} ${isCurrent ? 'sh-current' : ''}"
           href="https://www.skool.com/${encodeURIComponent(c.slug)}"
           data-slug="${escapeHtml(c.slug)}">
          <span class="sh-rr-dot"></span>
          <span class="sh-rr-name" title="${escapeHtml(c.slug)}">${escapeHtml(c.name || c.slug)}</span>
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
        notTodayEmptyMsg = '<div class="sh-empty sh-empty-sm">Keine passenden Communities offen. Filter (Sprache/Mitgliedschaft) blenden weitere aus.</div>';
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
    const items = Object.values(state.postHistory || {})
      .filter(p => (p.lastSeen || 0) >= cutoff)
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
      .slice(0, 50);
    if (!items.length) {
      body.innerHTML = '<div class="sh-empty sh-empty-sm">Noch keine gespeicherten Treffer. Scrolle durch deine Communities, damit sie erfasst werden.</div>';
      return;
    }
    body.innerHTML = items.map(p => `
      <div class="sh-cross-item">
        <div class="sh-cross-title">${escapeHtml((p.title || "").slice(0, 80))}</div>
        <div class="sh-cross-meta">${escapeHtml(p.community || "")} · ${escapeHtml(p.author || "")} · ${escapeHtml(formatRelativeTime(p.lastSeen))}</div>
        <div class="sh-cross-kw">${(p.matchedKeywords || []).map(k => `<span class="sh-kw">${escapeHtml(k)}</span>`).join("")}</div>
        ${p.url ? `<a class="sh-btn" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Oeffnen</a>` : ""}
      </div>
    `).join("");
  }

  function renderBookmarks() {
    if (!sidebarEl) return;
    const body = sidebarEl.querySelector("#sh-bookmarks-body");
    if (!body) return;
    const items = Object.values(state.bookmarks || {})
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    if (!items.length) {
      body.innerHTML = '<div class="sh-empty sh-empty-sm">Noch nichts gemerkt. Klicke bei einem Priority-Post auf "☆ Merken".</div>';
      return;
    }
    body.innerHTML = items.map(b => `
      <div class="sh-bm-item" data-id="${escapeHtml(b.id)}">
        <div class="sh-bm-title">${escapeHtml((b.title || "").slice(0, 80))}</div>
        <div class="sh-bm-meta">${escapeHtml(b.community || "")} ${escapeHtml(b.author || "")}</div>
        <div class="sh-bm-actions">
          <a class="sh-btn" href="${escapeHtml(b.url || "#")}" target="_blank" rel="noopener">Oeffnen</a>
          <button class="sh-btn sh-bm-del" data-id="${escapeHtml(b.id)}">Loeschen</button>
        </div>
      </div>
    `).join("");
    body.querySelectorAll(".sh-bm-del").forEach(btn => {
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
    if (parts.length > 0) {
      foot.textContent = parts.join(" · ");
    } else {
      foot.textContent = "Keywords & Communities in den Einstellungen";
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

  async function init() {
    await loadConfig();
    ensureSidebar();
    toggleSidebar(state.sidebarVisible);
    scan();
    mo.observe(document.body, { childList: true, subtree: true });

    let lastHref = location.href;
    setInterval(() => {
      if (location.href !== lastHref) {
        lastHref = location.href;
        state.sessionCounts = {};
        rescan();
      }
    }, 1500);

    // Timer-Update alle 30s, damit die Sekunden-Anzeige mitlaeuft
    setInterval(() => {
      if (state.showTimer || state.showEngagement) {
        renderFooterStats();
      }
    }, 30000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
