# 实时游戏部署与验收

正式页面 https://zjh1498358645.github.io/double/ ，浏览器通过现有 Pages API 域名连接 WebSocket。长期私人钥匙只用于现有 HTTP 身份校验，WebSocket 使用一次性、60秒有效的票据。每次配对确认和退出更新成员代际，旧连接与旧票据不能恢复权限。

D1 保存正式进度与结算，SQLite Durable Object 分发按成员过滤后的状态、临时绘画点和在线状态。约每40毫秒发送新增画点，松手及长笔画检查点持久保存；撤销/清空改变画板修订，旧笔画不能重现。连接正常时停止快速轮询，断线退避重连并回退轮询，每15秒检查版本。动画尊重减少动态效果设置。手机/微信实际网络延迟需要实体设备测试，不能用本地数值保证所有网络体验。

好友卡片只列出当前配对伙伴，可在小屋任意页面回应邀请。保留已有20种游戏，新增「一起拆炸弹」：5个加密模块，各自看到两位读数，减去当前模块偏移量后共同解锁；共享3次错误机会，局内公屏可一键交换私人线索。

## 免费部署顺序

```powershell
node scripts/build-cloudflare.mjs build
node node_modules/wrangler/bin/wrangler.js deploy --config wrangler.realtime.jsonc
node scripts/deploy-pages-api.mjs
node node_modules/vite/bin/vite.js build --config vite.github.config.ts
```

先部署独立对象 Worker，再部署带绑定的 Pages API，最后推送前端 main 触发 GitHub Pages。对象使用 `new_sqlite_classes`、`workers_dev:false`，公共入口返回404，未创建收费资源。免费服务有平台配额，达到限额仍回退到原有 HTTP 同步；不自动升级付款方案。已有 OAuth 可手动部署；CI 没有 API token 时只检查与构建。

回滚：恢复前端到上一已验证提交并重新触发 GitHub Pages；把上一版本后端构建并部署 Pages API。旧前端仍可走 HTTP。保留 D1 与 Durable Object 命名空间和迁移，不删除已有存档；若只需停用实时，移除 API 的 ROOM_REALTIME 绑定后重新部署，客户端会回退。

## 本地双客户端验收

```powershell
node scripts/build-cloudflare.mjs build
node scripts/dev-realtime-local.mjs
# 另一个终端
$env:TEST_ORIGIN='http://127.0.0.1:8788'
node tests/realtime-integration.mjs
node tests/realtime-latency.mjs
```

测试使用隔离 `.wrangler/qa-realtime-direct` 存储，自动生成身份并结束测试小屋，不输出私人钥匙。已迁移的数据可设 `QA_SKIP_MIGRATIONS=1`，仅用于本机 Miniflare 代理初始化异常的恢复。该环境直接执行构建模块，避开 Wrangler 本地 WebSocket 转发问题，不修改正式架构。本地 runtime 的兼容日期受已安装 workerd 支持上限限制，正式配置保持既有日期。

延迟按100条消息的对端实际接收时间统计 median/P95/max，标注网络条件。另运行所有 unit、原有 integration、media-integration、game-experience-integration、类型检查及两种构建。测试脚本依赖 Wrangler 已安装的 Miniflare、esbuild、undici 与 ws。
