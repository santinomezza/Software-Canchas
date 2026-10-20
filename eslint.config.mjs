import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Datos locales y artefactos:
    "data/**",
    ".tools/**",
    "qa/**",
    // Clon anidado del repo (no versionado):
    "Software-Canchas/**",
  ]),
]);

export default eslintConfig;
