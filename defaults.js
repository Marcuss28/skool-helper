"use strict";

/**
 * Skool Helper — Geteilte Defaults
 *
 * Single Source of Truth für alle Default-Werte. Vorher waren diese in
 * background.js, content.js und options.js dreifach dupliziert (mit
 * abweichendem Umfang in background.js — nur 4 von 10 Keys gesetzt).
 *
 * Wird in alle drei Kontexte geladen:
 * - Service Worker:   importScripts("defaults.js") in background.js
 * - Content Script:   manifest.json content_scripts.js: ["defaults.js","content.js"]
 * - Options Page:     <script src="defaults.js"></script> in options.html
 *
 * In allen drei Kontexten wird derselbe Schluessel im jeweiligen globalThis
 * gesetzt, sodass abhaengiger Code via globalThis.SKOOL_HELPER_DEFAULTS
 * darauf zugreifen kann.
 */
globalThis.SKOOL_HELPER_DEFAULTS = {
  keywords: ["youtube", "bilder", "videos", "todo", "prompt"],
  commentTemplates: [
    "Super Beitrag! Danke fürs Teilen. 🙌",
    "Richtig spannend – da hol ich mir Inspiration.",
    "Starker Input! Probier ich gleich mal aus.",
    "Nice, das passt gerade perfekt zu dem, woran ich arbeite.",
    "Mega, danke für den Prompt/Workflow – notiere ich mir."
  ],
  sidebarVisible: true,
  notifyOnMatch: true,
  languageFilter: "all",
  membersOnly: false,
  excludedKeywords: [],
  excludedAuthors: [],
  showTimer: false,
  showEngagement: false,
  checkForUpdates: true
};
