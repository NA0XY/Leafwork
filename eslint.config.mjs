import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "coverage/**",
      ".tmp/**",
      "public/workers/**"
    ]
  },
  ...nextVitals,
  {
    rules: {
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "no-console": ["error", { allow: ["error", "warn"] }]
    }
  }
];

export default config;
