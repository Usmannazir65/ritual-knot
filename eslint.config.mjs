import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // The HUD design relies on precise clip-path + object-fit on many small
      // local assets; plain <img> is the right tool here, not next/image.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
