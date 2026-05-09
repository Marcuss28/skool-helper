"use strict";

// Defaults aus defaults.js (vor dieser Datei via <script src> geladen).
// Single Source of Truth, geteilt mit Service Worker und Content Script.
const DEFAULTS_SYNC = globalThis.SKOOL_HELPER_DEFAULTS;

const $ = id => document.getElementById(id);

async function load() {
  const sync = await chrome.storage.sync.get(DEFAULTS_SYNC);
  $("keywords").value = (sync.keywords || []).join("\n");
  $("templates").value = (sync.commentTemplates || []).join("\n");
  $("sidebarVisible").checked = sync.sidebarVisible !== false;
  $("notifyOnMatch").checked = sync.notifyOnMatch !== false;
  $("languageFilter").value = sync.languageFilter || "all";
  if ($("membersOnly")) $("membersOnly").checked = sync.membersOnly === true;
  if ($("excludedKeywords")) $("excludedKeywords").value = (sync.excludedKeywords || []).join("\n");
  if ($("excludedAuthors")) $("excludedAuthors").value = (sync.excludedAuthors || []).join("\n");
  if ($("showTimer")) $("showTimer").checked = sync.showTimer === true;
  if ($("showEngagement")) $("showEngagement").checked = sync.showEngagement === true;

  const local = await chrome.storage.local.get({ communities: {} });
  renderCommunities(local.communities || {});
}

function renderCommunities(communities) {
  const box = $("communities-list");
  const entries = Object.entries(communities).sort((a, b) =>
    (a[1].name || a[0]).localeCompare(b[1].name || b[0])
  );
  if (!entries.length) {
    box.innerHTML = '<div class="empty">Noch keine Communities erfasst. Oeffne einfach eine deiner Skool-Communities - sie erscheint dann hier.</div>';
    return;
  }
  box.innerHTML = entries.map(([slug, c]) => `
    <div class="com-row" data-slug="${escapeHtml(slug)}">
      <div class="com-name">${escapeHtml(c.name || slug)} ${c.isMember === true ? '<span class="com-badge-member">Mitglied</span>' : ''}</div>
      <div class="com-slug">${escapeHtml(slug)}</div>
      <select class="com-lang" data-slug="${escapeHtml(slug)}">
        <option value="" ${!c.language ? "selected" : ""}>Sprache?</option>
        <option value="de" ${c.language === "de" ? "selected" : ""}>Deutsch</option>
        <option value="en" ${c.language === "en" ? "selected" : ""}>Englisch</option>
        <option value="other" ${c.language === "other" ? "selected" : ""}>Andere</option>
      </select>
      <div class="com-time">${c.lastVisit ? formatRelative(c.lastVisit) : "noch nicht besucht"}</div>
      <button class="com-del" data-slug="${escapeHtml(slug)}" title="Aus Rundlauf entfernen">Entfernen</button>
    </div>
  `).join("");

  box.querySelectorAll(".com-del").forEach(btn => {
    btn.addEventListener("click", async () => {
      const slug = btn.getAttribute("data-slug");
      const { communities = {} } = await chrome.storage.local.get({ communities: {} });
      delete communities[slug];
      await chrome.storage.local.set({ communities });
      renderCommunities(communities);
    });
  });

  box.querySelectorAll(".com-lang").forEach(sel => {
    sel.addEventListener("change", async () => {
      const slug = sel.getAttribute("data-slug");
      const value = sel.value;
      const { communities = {} } = await chrome.storage.local.get({ communities: {} });
      if (!communities[slug]) return;
      if (value) {
        communities[slug].language = value;
        communities[slug].languageSource = "manual";
      } else {
        delete communities[slug].language;
        delete communities[slug].languageSource;
      }
      await chrome.storage.local.set({ communities });
    });
  });
}

function formatRelative(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} h`;
  const d = Math.floor(h / 24);
  return `vor ${d} ${d === 1 ? "Tag" : "Tagen"}`;
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function parseList(val) {
  return val.split("\n").map(s => s.trim()).filter(Boolean);
}

async function save() {
  const payload = {
    keywords: parseList($("keywords").value).map(s => s.toLowerCase()),
    commentTemplates: parseList($("templates").value),
    sidebarVisible: $("sidebarVisible").checked,
    notifyOnMatch: $("notifyOnMatch").checked,
    languageFilter: $("languageFilter").value || "all",
    membersOnly: $("membersOnly") ? $("membersOnly").checked === true : false,
    excludedKeywords: parseList(($("excludedKeywords") || {value: ""}).value).map(s => s.toLowerCase()),
    excludedAuthors: parseList(($("excludedAuthors") || {value: ""}).value).map(s => s.toLowerCase()),
    showTimer: $("showTimer") ? $("showTimer").checked === true : false,
    showEngagement: $("showEngagement") ? $("showEngagement").checked === true : false
  };
  await chrome.storage.sync.set(payload);

  const toAdd = parseList($("communities-add").value)
    .map(s => s.toLowerCase().replace(/^\/+|\/+$/g, ""))
    .filter(s => /^[a-z0-9][a-z0-9-]*$/.test(s));
  if (toAdd.length) {
    const { communities = {} } = await chrome.storage.local.get({ communities: {} });
    for (const slug of toAdd) {
      if (!communities[slug]) {
        communities[slug] = { name: slug, lastVisit: 0, manuallyAdded: true };
      }
    }
    await chrome.storage.local.set({ communities });
    $("communities-add").value = "";
    renderCommunities(communities);
  }

  showStatus("Gespeichert");
}

async function reset() {
  await chrome.storage.sync.set(DEFAULTS_SYNC);
  await load();
  showStatus("Auf Standard zurückgesetzt");
}

async function resetCommunities() {
  if (!confirm("Besuchs-Historie und Community-Liste wirklich komplett löschen?")) return;
  await chrome.storage.local.set({ communities: {} });
  renderCommunities({});
  showStatus("Communities zurückgesetzt");
}

function showStatus(msg) {
  const el = $("status");
  el.textContent = msg;
  setTimeout(() => (el.textContent = ""), 2000);
}


function formatSummaryMarkdown(posts, title) {
  const byCommunity = {};
  for (const p of posts) {
    const key = p.community || "Unbekannt";
    if (!byCommunity[key]) byCommunity[key] = [];
    byCommunity[key].push(p);
  }
  const dateStr = new Date().toISOString().slice(0, 10);
  let md = `# ${title}\n\nStand: ${dateStr}\n\n`;
  md += `Gesamt: ${posts.length} priorisierte Posts in ${Object.keys(byCommunity).length} Communities.\n\n`;
  for (const [comm, items] of Object.entries(byCommunity)) {
    md += `## ${comm} (${items.length})\n\n`;
    for (const p of items) {
      const title = (p.title || "").replace(/\n/g, " ").trim();
      const author = p.author || "";
      const snippet = (p.snippet || "").replace(/\n/g, " ").trim();
      const keywords = (p.matchedKeywords || []).join(", ");
      md += `### ${title}\n`;
      if (author) md += `- Autor: ${author}\n`;
      if (keywords) md += `- Keywords: ${keywords}\n`;
      if (p.url) md += `- Link: ${p.url}\n`;
      if (snippet) md += `\n> ${snippet}\n\n`;
      else md += `\n`;
    }
  }
  return md;
}

async function exportSummary(hours, title) {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const { postHistory = {} } = await chrome.storage.local.get({ postHistory: {} });
  const posts = Object.values(postHistory)
    .filter(p => (p.lastSeen || 0) >= cutoff)
    .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  if (!posts.length) {
    showStatus("Keine Posts im Zeitraum");
    return;
  }
  const md = formatSummaryMarkdown(posts, title);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  // Filename: Umlaute transliterieren (sonst werden sie vom Sanitize-Regex
  // zu "-" und "Tagesüberblick" wird zu "tages-berblick").
  const safeTitle = title.toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-");
  a.download = `skool-helper-${safeTitle}-${dateStr}.md`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  showStatus(`Export: ${posts.length} Posts`);
}

async function exportBackup() {
  const sync = await chrome.storage.sync.get(null);
  const local = await chrome.storage.local.get({ communities: {}, bookmarks: {}, postHistory: {} });
  const payload = {
    schema: "skool-helper-backup-v1",
    exportedAt: new Date().toISOString(),
    sync,
    local
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `skool-helper-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  showStatus("Backup exportiert");
}

async function importBackupFromFile(file) {
  if (!file) return;
  let data;
  try {
    const text = await file.text();
    data = JSON.parse(text);
  } catch (e) {
    showStatus("Ungueltige JSON-Datei");
    return;
  }
  if (!data || data.schema !== "skool-helper-backup-v1" || !data.sync || !data.local) {
    showStatus("Backup-Format passt nicht");
    return;
  }
  if (!confirm("Bestehende Settings, Communities, Bookmarks und Historie wirklich überschreiben?")) {
    return;
  }
  try {
    await chrome.storage.sync.clear();
    await chrome.storage.sync.set(data.sync);
    await chrome.storage.local.set({
      communities: data.local.communities || {},
      bookmarks: data.local.bookmarks || {},
      postHistory: data.local.postHistory || {}
    });
    await load();
    showStatus("Backup eingelesen");
  } catch (e) {
    showStatus("Import fehlgeschlagen: " + (e && e.message || e));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  $("save").addEventListener("click", save);
  $("reset").addEventListener("click", reset);
  $("reset-communities").addEventListener("click", resetCommunities);
  if ($("export-summary")) $("export-summary").addEventListener("click", () => exportSummary(24, "Tagesüberblick"));
  if ($("export-weekly")) $("export-weekly").addEventListener("click", () => exportSummary(24 * 7, "Wochenüberblick"));

  if ($("export-backup")) $("export-backup").addEventListener("click", exportBackup);
  if ($("import-backup")) {
    $("import-backup").addEventListener("click", () => $("import-backup-file") && $("import-backup-file").click());
  }
  if ($("import-backup-file")) {
    $("import-backup-file").addEventListener("change", (ev) => {
      const file = ev.target.files && ev.target.files[0];
      importBackupFromFile(file);
      ev.target.value = "";
    });
  }

  const membersOnlyChk = $("membersOnly");
  if (membersOnlyChk) {
    membersOnlyChk.addEventListener("change", async () => {
      await chrome.storage.sync.set({ membersOnly: membersOnlyChk.checked === true });
      showStatus("Mitgliedschafts-Filter übernommen");
    });
  }
  const langFilter = $("languageFilter");
  if (langFilter) {
    langFilter.addEventListener("change", async () => {
      await chrome.storage.sync.set({ languageFilter: langFilter.value || "all" });
      showStatus("Sprachfilter übernommen");
    });
  }
});
