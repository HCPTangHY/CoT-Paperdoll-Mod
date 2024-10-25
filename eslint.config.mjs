import antfu from "@antfu/eslint-config";

export default antfu({
  stylistic: {
    semi: true,
    quotes: "double",
  },
}, {
  files: ["**/*.ts"],
  rules: {
    "no-console": "off",
  },
});
