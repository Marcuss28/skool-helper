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
  if ($("checkForUpdates")) $("checkForUpdates").checked = sync.checkForUpdates !== false;

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
      <input class="com-name-input" data-slug="${escapeHtml(slug)}"
             value="${escapeHtml(c.name || slug)}"
             placeholder="${escapeHtml(slug)}"
             title="Klick zum Bearbeiten — Enter oder Tab zum Speichern" />
      ${c.isMember === true ? '<span class="com-badge-member">Mitglied</span>' : '<span class="com-badge-member com-badge-empty"></span>'}
      <div class="com-slug">${escapeHtml(slug)}</div>
      <select class="com-lang" data-slug="${escapeHtml(slug)}">
        <option value="" ${!c.language ? "selected" : ""}>Sprache?</option>
        <option value="de" ${c.language === "de" ? "selected" : ""}>Deutsch</option>
        <option value="en" ${c.language === "en" ? "selected" : ""}>Englisch</option>
        <option value="other" ${c.language === "other" ? "selected" : ""}>Andere</option>
      </select>
      <select class="com-slot" data-slot="${escapeHtml(c.slot || "")}" data-slug="${escapeHtml(slug)}" title="Slot: Fest = täglich im Rundlauf, Skim = alle 14 Tage, Aus = nie">
        <option value="" ${!c.slot ? "selected" : ""}>Slot?</option>
        <option value="fest" ${c.slot === "fest" ? "selected" : ""}>Fest (täglich)</option>
        <option value="skim" ${c.slot === "skim" ? "selected" : ""}>Skim (14 Tage)</option>
        <option value="aus" ${c.slot === "aus" ? "selected" : ""}>Aus</option>
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

  box.querySelectorAll(".com-slot").forEach(sel => {
    sel.addEventListener("change", async () => {
      const slug = sel.getAttribute("data-slug");
      const value = sel.value;
      const { communities = {} } = await chrome.storage.local.get({ communities: {} });
      if (!communities[slug]) return;
      if (value) {
        communities[slug].slot = value;
      } else {
        delete communities[slug].slot;
      }
      await chrome.storage.local.set({ communities });
      sel.setAttribute("data-slot", value || "");
      const label = value === "fest" ? "fester Slot"
                  : value === "skim" ? "Skim-Slot"
                  : value === "aus"  ? "aus dem Rundlauf"
                  : "ohne Slot";
      showStatus(`${communities[slug].name || slug}: ${label}`);
    });
  });

  // Manuelles Editieren des Community-Namens. Speichert bei blur oder Enter.
  // Leerer String = Reset auf Slug-Fallback (Sidebar zeigt dann den Slug).
  box.querySelectorAll(".com-name-input").forEach(input => {
    const save = async () => {
      const slug = input.getAttribute("data-slug");
      const newName = (input.value || "").trim();
      const { communities = {} } = await chrome.storage.local.get({ communities: {} });
      if (!communities[slug]) return;
      const oldName = communities[slug].name || "";
      if (newName === oldName) return;
      if (newName) {
        communities[slug].name = newName;
      } else {
        delete communities[slug].name;
      }
      // manuallyAdded-Flag setzen — verhindert ggf. zukuenftige Heuristik-
      // Ueberschreibung. Aktuell ueberschreibt Nav-Scan immer noch, das ist
      // Absicht (Nav ist die zuverlaessigste Quelle). Wer den Namen hier
      // manuell setzt und Nav widerspricht, hat ein Datenproblem auf Skool-Seite.
      communities[slug].nameManual = !!newName;
      await chrome.storage.local.set({ communities });
      showStatus(newName ? `Name gespeichert: ${newName}` : "Name geleert");
    };
    input.addEventListener("blur", save);
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        input.blur();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        input.value = input.getAttribute("value") || "";
        input.blur();
      }
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
    showEngagement: $("showEngagement") ? $("showEngagement").checked === true : false,
    checkForUpdates: $("checkForUpdates") ? $("checkForUpdates").checked === true : true
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

async function clearCommunityNames() {
  const { communities = {} } = await chrome.storage.local.get({ communities: {} });
  const slugs = Object.keys(communities);
  if (!slugs.length) {
    showStatus("Keine Communities erfasst");
    return;
  }
  if (!confirm(`Namen aller ${slugs.length} Communities leeren? Besuchshistorie, Sprache, Punkte und Mitgliedschafts-Status bleiben erhalten. Beim nächsten Skool-Besuch werden Namen aus der Skool-Navigation neu erfasst.`)) return;
  for (const slug of slugs) {
    delete communities[slug].name;
    delete communities[slug].nameManual;
  }
  await chrome.storage.local.set({ communities });
  renderCommunities(communities);
  showStatus(`Namen von ${slugs.length} Communities geleert`);
}

/**
 * Setzt `isMember` auf allen Communities zurueck. Noetig, weil Versionen vor
 * v0.7.1 jede nur besuchte Community als Mitgliedschaft markiert haben.
 * Bewusst kein Auto-Cleanup beim Update: Skools Nav-Drawer listet nicht in
 * jeder Situation alle Mitgliedschaften: eine Automatik wuerde echte
 * Mitgliedschaften auf "kein Mitglied" setzen. Nach dem Reset fuellt der
 * Nav-Scan die Flags ueber die naechsten Skool-Besuche korrekt wieder auf.
 */
async function resetMemberships() {
  const { communities = {} } = await chrome.storage.local.get({ communities: {} });
  const slugs = Object.keys(communities);
  if (!slugs.length) {
    showStatus("Keine Communities erfasst");
    return;
  }
  const markiert = slugs.filter(s => communities[s].isMember === true).length;
  if (!confirm(`Mitgliedschafts-Markierung von ${markiert} Community(s) zurücksetzen? Namen, Besuchshistorie, Sprache, Punkte und Slots bleiben erhalten. Beim nächsten Skool-Besuch werden echte Mitgliedschaften aus deiner Skool-Navigation neu erkannt.`)) return;
  for (const slug of slugs) {
    delete communities[slug].isMember;
  }
  await chrome.storage.local.set({ communities });
  renderCommunities(communities);
  showStatus(`Mitgliedschaften zurückgesetzt (${markiert} Markierungen entfernt)`);
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

async function applyUpdateBadge() {
  try {
    const v = chrome.runtime.getManifest().version;
    const badge = document.getElementById("version-badge");
    if (!badge) return;
    const { updateInfo } = await chrome.storage.local.get({ updateInfo: null });
    const hasUpdate = updateInfo && updateInfo.updateAvailable === true && updateInfo.latestVersion;
    if (hasUpdate) {
      badge.innerHTML = `<a href="${updateInfo.url || `https://github.com/Marcuss28/skool-helper/releases/latest`}" target="_blank" rel="noopener" class="version-update" title="Update verfügbar: v${updateInfo.latestVersion}">v${v} → v${updateInfo.latestVersion}</a>`;
    } else {
      badge.textContent = "v" + v;
    }
  } catch (e) {}
}

document.addEventListener("DOMContentLoaded", () => {
  applyUpdateBadge();

  load();
  $("save").addEventListener("click", save);
  $("reset").addEventListener("click", reset);
  $("reset-communities").addEventListener("click", resetCommunities);
  if ($("clear-names")) $("clear-names").addEventListener("click", clearCommunityNames);
  if ($("reset-memberships")) $("reset-memberships").addEventListener("click", resetMemberships);
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

  const checkUpdatesChk = $("checkForUpdates");
  if (checkUpdatesChk) {
    checkUpdatesChk.addEventListener("change", async () => {
      await chrome.storage.sync.set({ checkForUpdates: checkUpdatesChk.checked === true });
      showStatus("Update-Check " + (checkUpdatesChk.checked ? "aktiviert" : "deaktiviert"));
    });
  }
  const checkNowBtn = $("check-now");
  if (checkNowBtn) {
    checkNowBtn.addEventListener("click", () => {
      const status = $("update-status");
      if (status) status.textContent = "Suche…";
      chrome.runtime.sendMessage({ type: "check-for-updates" }, async () => {
        await applyUpdateBadge();
        const { updateInfo } = await chrome.storage.local.get({ updateInfo: null });
        if (status) {
          if (updateInfo && updateInfo.updateAvailable) {
            status.textContent = `Update verfügbar: v${updateInfo.latestVersion}`;
          } else if (updateInfo && updateInfo.latestVersion) {
            status.textContent = `Aktuelle Version: v${updateInfo.latestVersion}`;
          } else {
            status.textContent = "Konnte nicht prüfen (Netzwerk?)";
          }
          setTimeout(() => { status.textContent = ""; }, 4000);
        }
      });
    });
  }

  // Storage-Listener: wenn Background den Update-Check abgeschlossen hat,
  // Badge live aktualisieren ohne Reload.
  //
  // v0.7.5: Die Community-Liste wird jetzt ebenfalls live nachgezogen.
  // Vorher las `load()` sie nur beim Oeffnen der Seite. Wer die Optionen in
  // einem Tab offen liess und nebenher auf Skool surfte, sah dauerhaft einen
  // veralteten Stand — im Extremfall "Noch keine Communities erfasst",
  // waehrend die Sidebar schon vier zeigte.
  //
  // Beim Tippen im Namensfeld wird bewusst NICHT neu gerendert: Ein Rerender
  // wuerde den Fokus und die halbfertige Eingabe wegwerfen.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.updateInfo) applyUpdateBadge();
    if (area === "local" && changes.communities) {
      const aktivesFeld = document.activeElement;
      const tipptGerade = aktivesFeld && aktivesFeld.classList
        && aktivesFeld.classList.contains("com-name-input");
      if (!tipptGerade) renderCommunities(changes.communities.newValue || {});
    }
  });
});
