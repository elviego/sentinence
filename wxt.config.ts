import { defineConfig } from "wxt";

export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Sentinence — Argument Mapper",
    description:
      "Classifies every sentence in an article as Claim, Evidence, Counter-argument, or Opinion.",
    version: "0.1.0",
    permissions: ["sidePanel", "activeTab", "scripting", "storage", "tabs"],
    host_permissions: ["https://*/*", "http://*/*"],
    action: {
      default_title: "Open Sentinence",
    },
    side_panel: {
      default_path: "sidepanel.html",
    },
  },
});
