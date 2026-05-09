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
});

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

  return false;
});
