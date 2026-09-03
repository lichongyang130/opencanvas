# Next.js 16 升级说明（14 → 16）

## 版本
- `next` 16.3.x、`react`/`react-dom` 19.2.x、`zustand` 5.x
- `eslint` 9 + `eslint.config.mjs`（flat config；`next lint` 已移除，`npm run lint` = `eslint .`）
- `eslint-config-next` 16（含 React Compiler 实验规则；本项目已关闭 `set-state-in-effect`/`purity`，配置内注明）

## 适配点
1. **`cookies()` async**：`src/lib/i18n/server.ts` 的 `getLocale/getDict` 返回 Promise；
   `layout` 用 `generateMetadata`（async）按请求读取 cookie，`RootLayout`/隐私/条款页 async。
2. **动态路由 `params` 为 Promise**：全部 route handler 与 `/s/[code]` 页面已用官方
   `npx @next/codemod@latest next-async-request-api` 转换（`props: { params: Promise<...> }` + `await props.params`）。
3. **`next.config.mjs`**：`experimental.serverComponentsExternalPackages` → 顶层
   `serverExternalPackages`（bullmq / @aws-sdk/client-s3 / @valkey/valkey-glide）。
4. **dev 默认 Turbopack**；`next build` 已验证通过（webpack 兼容路径同样可用）。

## 回归基线（一次确认即视为回归通过）
- `npm run build` 0 error；`tsc --noEmit` 0；`npm run lint` 0
- `/`、`/privacy`、`/terms`、`/docs`、`/s/[code]`、`/api/health`、`/api/documents` 上传下载、
  `/api/knowledge/[id]/query`（tfidf 降级）均 200
