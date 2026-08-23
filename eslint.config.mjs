import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    "coverage/**",
    "node_modules/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // These compiler-oriented rules reject legitimate controlled resets in
      // existing interactive islands. Core Hooks, dependency and a11y rules
      // remain enabled; these are revisited component-by-component as the
      // islands are split during Phase 2.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/components/home/CampaignAlbum.tsx"],
    rules: {
      // The RAF-driven cinema viewer intentionally stores mutable animation
      // cursors in refs and updates them outside React's render data flow.
      "react-hooks/immutability": "off",
    },
  },
]);
