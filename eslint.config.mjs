import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

/**
 * Next 16 + ESLint 9 flat config。
 * 说明：eslint-config-next 16 引入了 React Compiler 实验规则
 * （react-hooks/set-state-in-effect、react-hooks/purity），对本项目存量
 * 「useEffect 同步初始化」模式在 React 19 运行时是合法的（未启用 compiler），
 * 故关闭；其余规则（unused vars、next 组件规则等）保持生效。
 */
export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-location-assign-relative-destination": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
]);
