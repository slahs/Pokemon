import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { rules: { "@next/next/no-img-element": "off" } },
  { ignores: [".next/**", "node_modules/**", "playwright-report/**", "test-results/**"] },
];

export default eslintConfig;
