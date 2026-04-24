"use strict";

document.getElementById("open-options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("toggle-sidebar").addEventListener("click", async () => {
  const { sidebarVisible = true } = await chrome.storage.sync.get({ sidebarVisible: true });
  await chrome.storage.sync.set({ sidebarVisible: !sidebarVisible });
  window.close();
});
