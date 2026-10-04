# 小满 · 双人秘密基地

手机优先的双人网页：温暖手绘小屋、20种游戏、日常与自定义挑战、星星装饰、留言与私人相册。

## 免费 Cloudflare 部署

现已提供独立免费版本：[打开小屋](https://double-secret-base.junhaizheng34.workers.dev)。使用私人钥匙登录，D1保存存档及480像素压缩相册，不需要R2或绑定付款方式。[部署与GitHub自动更新说明](docs/cloudflare.md)。下方ChatGPT登录说明适用于保留的Sites版本。

## 使用

两人各自使用ChatGPT账号登录。创建者创建小屋并生成12位邀请码；另一人输入邀请码申请，由创建者确认。邀请码24小时有效，配对后失效。网站访问权限与小屋成员权限分开：Sites新站默认仅所有者可访问，分享给第二个人前要配置网站访问权限。

底部“小屋 / 游戏 / 挑战 / 我们”导航。点信箱留言，点游戏机开局，点相册上传照片。游戏支持错时接续，在线可见页面每2秒同步。反应赛各自测量5次，计时仅供休闲娱乐。

## 开发

需要Node.js >=22.13.0以及npm。沿用Sites的Vinext模板、构建插件和认证助手。

```powershell
npm ci
npm run db:generate
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_fresh_franklin_richards.sql
npm run dev
```

迁移只应用一次。数据库使用生成的Drizzle迁移，生产由Sites发布流程应用。DB和BUCKET是逻辑绑定，不要在源码保存真实资源凭据。

## 验证

```powershell
node --experimental-strip-types --test tests/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --experimental-strip-types tests/integration.mjs
```

integration.mjs需要运行本地开发服务器127.0.0.1:5173。每次生成两个新的本地测试身份，走通配对、全部12游戏、奖励上限、并发购买、R2照片及权限。测试身份cookie只在Vite开发中间件使用，不进入生产Worker。

已在本地完成规则与存储行为测试、完整双身份服务器测试，并检查360/390像素浏览器视口。未用两台实体手机或真实对象账号验收。线上发布状态以Sites结果为准。

## 数据规则

每间小屋最多两人、同时一局游戏；正常结束双人游戏+5星星，两人完成挑战+10，每日合计最多50。装饰12件，价格20/40/60。图片选择JPEG/PNG/WebP，原图10MB以内；手机浏览器缩放长边至1600并转换PNG，再由服务器验证、重编码、移除元数据，R2仅授权成员可读。相册最多100张。

保留最近100局详细战绩、最多150个挑战实例和200条留言。历史及媒体作者绑定账号而非成员位置，重新配对不继承前任作者的删除权限。离开撤销访问、保留共同内容并结束当前游戏。

使用单间小屋JSON状态和索引成员表；乐观版本比较及数据库批处理保证共享修改原子性，旧版本返回409。房间事务存储最近1000个操作回执，处理重复请求。照片存储与数据库分别保存，失败清理上传对象。

## 技术说明

Cloudflare D1批处理的事务行为依据[官方D1文档](https://developers.cloudflare.com/d1/worker-api/d1-database/)；R2服务端读写依据[官方R2文档](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)。照片使用pngjs的浏览器实现，避免Node zlib原型与Workers兼容层的差异。

