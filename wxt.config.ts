import { defineConfig } from "wxt";

export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  outDir: "dist",
  manifest: {
    name: "Sentinence — Argument Mapper",
    description:
      "Classifies every sentence in an article as Claim, Evidence, Counter-argument, or Opinion.",
    version: "0.1.0",
    permissions: ["sidePanel", "activeTab", "scripting", "storage", "tabs"],
    host_permissions: ["https://*/*", "http://*/*"],
    icons: {
      16: "icon-16.png",
      32: "icon-32.png",
      48: "icon-48.png",
      128: "icon-128.png",
    },
    action: {
      default_title: "Open Sentinence",
      default_icon: {
        16: "icon-16.png",
        32: "icon-32.png",
        48: "icon-48.png",
        128: "icon-128.png",
      },
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
  },
});
