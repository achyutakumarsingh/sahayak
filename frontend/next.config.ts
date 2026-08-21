import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app is one half of a monorepo; pin the root so Turbopack does not
  // infer it from the lockfile at the repository root.
  turbopack: {
    root: path.join(__dirname),
  },

  // The repository already has a hand-written CLAUDE.md at its root.
  agentRules: false,

  async headers() {
    return [
      {
        // The service worker must never be served from a stale cache.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
