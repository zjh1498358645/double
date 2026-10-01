# 免费 Cloudflare 版本

代码在 GitHub，网站运行于 Cloudflare Workers Free，存档与压缩相册使用 D1。无需 R2、付款方式或自定义域名。没有启用或升级付费套餐。

## 使用

两人各自在自己的手机打开网站，生成并安全保存私人钥匙。私人钥匙是登录凭据，不能发给对方；小屋创建者另行生成12位邀请码用于配对。换手机时粘贴私人钥匙登录。顶部钥匙按钮可再次查看和保存自己的钥匙。钥匙丢失且浏览器登录也清除后无法恢复。

Cloudflare 版使用新数据库，旧 Sites 网站保留原存档。页面可以公开打开，房间内容只允许已经配对的成员访问。私人钥匙由256位随机数生成，服务器以哈希识别账号；登录cookie为HttpOnly、Secure、SameSite=Lax、host-only。独立版本不接受ChatGPT身份请求头。

相册最多100张，每张压缩到最长边480像素、最多1MB。服务端验证PNG结构和校验值并移除非图像元数据。照片保存在D1 BLOB，读取仍经过房间成员权限检查。适合手机查看，不保存原尺寸照片。

## 部署

```sh
npm ci
node --experimental-strip-types --test tests/*.test.mjs
npx tsc --noEmit --incremental false
npm run build:cloudflare
npx wrangler d1 migrations apply DB --remote --config wrangler.jsonc
npm run deploy:cloudflare
```

免费额度达到上限时服务可能暂停或报错，系统不会自动升级付费计划。当前账户的其他应用也会使用账户共享额度。

## GitHub 自动更新

工作流 `.github/workflows/cloudflare.yml` 已配置：main分支推送后测试、构建、应用迁移、发布。首次启用需要在仓库 Settings → Secrets and variables → Actions 添加 `CLOUDFLARE_API_TOKEN`，不要写进源码、聊天或普通变量。

在 Cloudflare 创建限制到此账号的API token，授权 Account / Workers Scripts / Edit 与 Account / D1 / Edit。仅用于此仓库部署，可按需加到期时间。OAuth本机登录不会自动成为GitHub的长期部署凭据。未添加secret前，网站仍可使用，但自动部署不能发布更新。

参考：[GitHub Actions 部署](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)、[Workers 免费计划](https://developers.cloudflare.com/workers/platform/pricing/)、[D1 限制](https://developers.cloudflare.com/d1/platform/limits/)。
