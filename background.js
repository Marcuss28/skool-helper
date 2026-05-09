"use strict";

// Geteilte Defaults aus defaults.js — Single Source of Truth ueber Service
// Worker, Content Script und Options Page hinweg. Verhindert Drift bei
// Default-Werten und reduziert Wartungsaufwand.
importScripts("defaults.js");
const DEFAULTS = globalThis.SKOOL_HELPER_DEFAULTS;

// Beim Install Defaults setzen, ohne bestehende Werte zu überschreiben.
// (Vor v0.4.10 wurden hier nur 4 von 10 Keys gesetzt — Bug fixed mit
// Umstellung auf zentrale Defaults.)
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  const patch = {};
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (existing[k] === undefined) patch[k] = v;
  }
  if (Object.keys(patch).length) await chrome.storage.sync.set(patch);
  checkForUpdates();
});

chrome.runtime.onStartup.addListener(() => {
  checkForUpdates();
});

// Update-Check: einmal taeglich gegen GitHub Releases API. Per Setting
// `checkForUpdates` deaktivierbar. Ergebnis wandert in storage.local und
// wird vom Content-Script (Footer) und der Options-Page gerendert.
const UPDATE_REPO = "Marcuss28/skool-helper";
const UPDATE_ALARM = "skool-helper-update-check";

chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === UPDATE_ALARM) checkForUpdates();
});

function semverGt(a, b) {
  const pa = String(a || "0").split(".").map(n => parseInt(n, 10) || 0);
  const pb = String(b || "0").split(".").map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const av = pa[i] || 0;
    const bv = pb[i] || 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

async function checkForUpdates() {
  try {
    const { checkForUpdates: enabled = true } = await chrome.storage.sync.get({ checkForUpdates: true });
    if (!enabled) return;

    const r = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!r.ok) return;
    const data = await r.json();
    const latestTag = (data.tag_name || "").replace(/^v/, "");
    const currentVersion = chrome.runtime.getManifest().version;

    await chrome.storage.local.set({
      updateInfo: {
        latestVersion: latestTag,
        url: data.html_url || `https://github.com/${UPDATE_REPO}/releases/latest`,
        checkedAt: Date.now(),
        updateAvailable: semverGt(latestTag, currentVersion)
      }
    });
  } catch (e) {
    // Netzwerk-Fehler / Rate-Limit: leise ignorieren, beim naechsten Lauf
    // wird's nochmal probiert.
  }
}

// Tastatur-Shortcut: Alt+Shift+S togglet die Sidebar global (sync-Storage,
// damit der content-Script das Storage-Change-Event mitbekommt).
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "toggle-sidebar") return;
    try {
      const { sidebarVisible = true } = await chrome.storage.sync.get({ sidebarVisible: true });
      await chrome.storage.sync.set({ sidebarVisible: !sidebarVisible });
    } catch (e) {
      console.warn("[Skool Helper] Sidebar-Toggle fehlgeschlagen:", e);
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return;

  if (msg.type === "notify") {
    try {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: msg.title || "Skool Helper",
        message: msg.message || "",
        priority: 1
      });
    } catch (e) {
      // Notifications silent fail, kein Drama
    }
  }

  if (msg.type === "open-options") {
    chrome.runtime.openOptionsPage();
  }

  if (msg.type === "check-for-updates") {
    checkForUpdates().then(() => {
      try { sendResponse({ ok: true }); } catch (e) {}
    });
    return true; // async response
  }

  return false;
});
