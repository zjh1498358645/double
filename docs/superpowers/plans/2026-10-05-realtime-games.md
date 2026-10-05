# Realtime Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 双方实时看到游戏操作，当前伙伴可从好友卡片直接发起并响应邀请。

**Architecture:** D1 与现有游戏引擎继续负责持久状态和结算；独立 SQLite Durable Object 负责 WebSocket、预览与在线状态。浏览器使用现有 Pages API 域名，正常连接停止快速轮询，断线保留轮询回退。

**Tech Stack:** React 19、TypeScript、Cloudflare Pages、Workers SQLite Durable Objects、D1、Wrangler 4、Node 原生测试。

**Spec:** `docs/superpowers/specs/2026-10-05-realtime-games-design.md`，实施前必须完整阅读。

## Global Constraints

- 保留现有 20 种游戏、私人钥匙、配对关系、照片、信箱和星星记录，沿用 GitHub Pages 正式网址与免费服务。
- 浏览器连接 `wss://double-secret-base-api.pages.dev/api/base/realtime`。
- 票据 60 秒有效、一次性消费；长期钥匙不进入 WebSocket URL。
- 绘画单包最多 8 KB、最多 60 个点，每连接最多每秒 30 包；约每 40ms 推送新增点。
- 长笔画每 1 秒或达到现有点数上限保存检查点；预览不能替代持久保存。
- 在线连接每 15 秒轻量版本核对；异常断连 45 秒内转离线；重连间隔 1、2、4、8、15 秒上限及随机抖动。
- 动画 120–220ms，尊重 reduced-motion；隐藏选择不做猜测性渲染。
- 受控 RTT≤100ms、无丢包测试中，对端呈现 P95 目标≤250ms；本地绘画按 60fps 调度。
- 无自动付费升级，不删除旧 D1 数据；正式网址 `https://zjh1498358645.github.io/double/`。

## Review Focus

- 后台标签页恢复及多标签页同时在线：在线状态合并正确，恢复后不重复提交（Task 2、4）。
- 用户退出再加入同一槽位：原连接与旧代际数据不能访问新成员信息（Task 2、3）。
- D1 保存成功、实时发布失败：动作仍成功，版本核对修复伙伴画面（Task 3、4）。
- 橡皮、撤销与晚到笔画包交错：清除内容不复活，持久确认不造成闪烁（Task 5）。
- 邀请按钮双击及离线接收：只有一个当前游戏，重新上线可回应同一邀请（Task 6）。

## File structure and interfaces

新增 `src/realtime/protocol.ts` 定义协议与校验，`src/realtime/reducer.ts` 管理版本及预览，`src/realtime/client.ts` 管理连接；`src/server/realtime.ts` 承担票据与持久通知适配；`workers/realtime.ts` 实现对象。React 集成集中于 `app/components/useRealtime.ts`、`FriendPanel.tsx`、`GameInvitation.tsx`，不把网络逻辑继续堆入 BaseApp。

公共类型：`RoomSnapshot = Awaited<ReturnType<BaseStore['mine']>>`；`Epoch = string`（服务端成员 ID 对的哈希）；`GameEpoch = string`（游戏 ID、回合及绘画修订的组合）；`Presence = 'online'|'away'|'offline'`。新增绘画修订字段默认 0 兼容旧存档，在撤销、清空、换题时递增。

协议 `v:1`。客户端包：`visibility {visible:boolean}`、`preview {gameId,gameEpoch,strokeId,seq,offset,color,width,tool,points}`、`preview-resync {gameId,gameEpoch,strokeId}`、`version-check {version}`。服务端包：`hello {connectionId,epoch,snapshot,presence}`、`snapshot {epoch,snapshot}`、`presence {slots:[Presence,Presence]}`、`preview`、`preview-reset {gameEpoch}`、`preview-full {gameEpoch,stroke}`。预览使用现有 Stroke 类型和坐标范围，校验拒绝多余字段。

### Task 1: Protocol and monotonic state

**Files:** Create `src/realtime/protocol.ts`, `src/realtime/reducer.ts`, `tests/realtime-protocol.test.mjs`.

**Interfaces:** `parseClientMessage(raw:string):ClientMessage`；`applySnapshot(previous:RoomSnapshot,next:RoomSnapshot,epoch:Epoch,currentEpoch:Epoch):RoomSnapshot`；`applyPreview(layer:PreviewLayer,message:PreviewMessage):PreviewLayer`，返回缺口信息供请求完整笔画。

- [ ] 写失败测试：`reject invalid packets` 断言 8193 bytes、61 点、越界点、非有限数、未知类型全部抛错；`discard stale versions` 断言版本 9 不覆盖 10、旧 epoch 不覆盖新 epoch；`sequence gaps` 断言重复包无新增点、缺口标记需要 resync。
- [ ] 运行 `node --test tests/realtime-protocol.test.mjs`，确认因新增模块缺失失败。
- [ ] 实现上述签名、类型与大小校验；预览以 gameEpoch、strokeId 和序号索引，完整笔画最多现有 240 点。
- [ ] 重跑同一命令，全部 PASS；提交 `feat: define realtime protocol and ordered state`。

### Task 2: Room Durable Object and authenticated tickets

**Files:** Create `workers/realtime.ts`, `wrangler.realtime.jsonc`, `src/server/realtime.ts`, `tests/realtime-room.test.mjs`; modify `wrangler.pages.jsonc`, `wrangler.jsonc` and existing Env declarations where required.

**Interfaces:** Export `RoomRealtime` Durable Object；`issueTicket(env,actor:Actor,origin:string):Promise<{ticket:string,url:string,expires:number}>`；对象内部 `/ticket`、`/connect`、`/publish`、`/revoke` 仅通过绑定使用。Worker 公共 fetch 返回 404。对象绑定 DB；每屋通过 `idFromName(roomId)` 定位。

- [ ] 写失败测试：60 秒到期、重复消费、错误 Origin、错误成员全部拒绝；旧成员退出后连接关闭；两个标签页一个隐藏仍 online，全部隐藏 away，45 秒失联 offline；超过每秒 30 包拒绝。用可注入时钟及对象存储／D1 fake 测核心处理器。
- [ ] 运行 `node --test tests/realtime-room.test.mjs`，确认失败。
- [ ] 实现票据随机 32 bytes、仅存哈希、SQLite 持久消费；连接 attachment 保存身份与代际，使用 Hibernation API 和自动 ping/pong。对象恢复时重新读 D1 验证，不依赖丢失内存。成员缓存上限 1 秒；接收者校验代际后发送，敏感包不得跨代际。
- [ ] 配置 SQLite migration `new_sqlite_classes:['RoomRealtime']`，名称 `double-secret-base-realtime`，Pages `ROOM_REALTIME` 绑定对应 script/class；禁用 workers_dev；部署服务绑定不含浏览器私钥。
- [ ] 重跑对象测试及 `node node_modules/typescript/bin/tsc --noEmit`，修复类型后提交 `feat: add free room realtime service`。

### Task 3: Pages upgrade and committed-state publication

**Files:** Modify `build/cloudflare-worker.ts`, `app/api/base/[...path]/route.ts`, `src/server/realtime.ts`, `src/server/store.ts`; create `tests/realtime-api.test.mjs`.

**Interfaces:** `publishRoom(env,roomId:string):Promise<void>` 读取最终 D1 行与成员，调用 snapshot 分槽生成视图；`revokeRoom(env,roomId:string):Promise<void>` 重验并关闭撤销身份；ticket POST 走已有 getChatGPTUser；升级入口先校验 Origin 再通过绑定消费票据。

- [ ] 写失败测试：响应保留 101 的 webSocket；携钥匙原有 HTTP 登录仍有效；drawer 题目仅 drawer 可见、对方手牌不出现在发给伙伴的 JSON；提交成功但 publish 抛错仍返回成功且最新 snapshot；leave 后旧连接无法接收新成员状态。
- [ ] 运行 `node --test tests/realtime-api.test.mjs`，确认失败。
- [ ] 实现升级的早返回（在普通 Response 包装前）；增加 ticket 分支；操作成功返回原结果加 `snapshot`，通知全部小屋变更包括确认、退出、照片和信箱，退出前保存 roomId 供撤销。发布失败记录无秘密错误并保留提交成功。
- [ ] 新增 `GET /api/base/version`，现有身份校验后只返回 roomId、version、epoch；退出／无成员返回空成员状态，供 15 秒轻量校验。通知未到时由客户端补拉 mine。
- [ ] 跑 API 测试、现有 store/origin/key-auth 测试和 Cloudflare 构建，全部通过后提交 `feat: publish authoritative room updates through Pages`。

### Task 4: Client connection and fallback

**Files:** Create `src/realtime/client.ts`, `app/components/useRealtime.ts`, `tests/realtime-client.test.mjs`; modify `app/components/BaseApp.tsx`, `src/game-sync.ts`.

**Interfaces:** `createRealtimeClient({getTicket,onMessage,onStatus,WebSocketImpl,clock}):{start():void;stop():void;send(message:ClientMessage):boolean}`；`useRealtime({actorKey,roomId,onSnapshot}):{status,presence,previews,sendPreview}`。不输出或缓存长期钥匙；session identity 更换 stop 清理所有队列。

- [ ] 用假 socket、时钟写失败测试：连接成功停止快速轮询；断线启用原 syncDelay；1/2/4/8/15 秒退避；visibility 恢复立即校验；每 15 秒版本检查发现更高版本拉取 mine；旧 socket 回调不能写新用户状态；重复确认不重复动作。
- [ ] 运行 `node --test tests/realtime-client.test.mjs`，确认失败。
- [ ] 实现 hook 与 client 生命周期、45 秒心跳失联处理、随机抖动和必要定时器清理；BaseApp 的 HTTP 响应、推送、GET 共用 monotonic reducer。保留现有 refresh coordinator 与 409 同请求 ID 重试。
- [ ] 重跑客户端与 game-sync 测试、类型检查，提交 `feat: connect game clients with reconnect and fallback`。

### Task 5: Smooth drawing preview and durable checkpoints

**Files:** Modify `app/components/DrawingPad.tsx`, `GamePlay.tsx`, `ExtendedPlay.tsx`, `src/games/drawing.ts`, `src/games/extended.ts`; create `src/realtime/drawing-preview.ts`, `tests/realtime-drawing.test.mjs`.

**Interfaces:** `createPreviewPublisher(emit:(m:PreviewMessage)=>boolean,clock):{append(stroke:Stroke,gameId:string,gameEpoch:string):void;flush():void;reset():void}`；DrawingPad 接收 `gameId,gameEpoch,previews,sendPreview`，原持久 send 接口不变。

- [ ] 写失败测试：移动点 40ms 内发包，静止无重复；每包≤60 点，240 点分段；抬笔马上保存、长笔画 1 秒检查点；迟到 ACK 不移除更多未保存点；undo/clear/new round 清预览且旧包不复活；橡皮属性保留；对象重启后重发待确认段且持久笔画无重复。
- [ ] 运行 `node --test tests/realtime-drawing.test.mjs`，确认失败。
- [ ] 实现 rAF 合并 pointer 采样、增量序号和 full-resync；客户端按 round 修订合并持久／预览。引擎维护绘画修订默认值与增量，API 持久校验不绕过。连接可用时不再 220ms HTTP 写整条笔画；断线沿用已批准的检查点及现有重试队列。
- [ ] 跑新测试、games/extended/game-sync 测试；浏览器检查手机宽度下颜色、画笔、橡皮、公屏；提交 `feat: stream drawing points with durable checkpoints`。

### Task 6: Friend card and invitation lifecycle

**Files:** Create `app/components/FriendPanel.tsx`, `app/components/GameInvitation.tsx`, `tests/friend-invites.test.mjs`; modify `BaseApp.tsx`, `src/server/model.ts`, `app/globals.css`.

**Interfaces:** `FriendPanel({name,slot,presence,currentGame,onInvite,onContinue})`；`GameInvitation({game,names,slot,busy,onAccept,onDecline})`；`transition` 增加 `game-decline`，payload 必须包含当前 gameId 且仅接收者可拒绝 invited 游戏，转 abandoned。

- [ ] 写失败测试：接收者拒绝合法、发起者拒绝非法、旧 gameId 不能结束新局；双击 create 仅一局；离线重返快照仍有同一邀请；已有 active 游戏只允许继续。推送通知按 gameId 去重。
- [ ] 运行 `node --test tests/friend-invites.test.mjs`，确认失败。
- [ ] 实现伙伴头像昵称状态、游戏选择、两个头像准备状态、全页面邀请接受／拒绝；保留原外部 InvitationShare，未配对时显示原配对入口；多标签页接收同一邀请不会创建第二局。
- [ ] 跑新测试及 invites/model/game-experience 测试；浏览器检查键盘、窄屏、对话框焦点和可见状态；提交 `feat: invite paired friend from anywhere in the base`。

### Task 7: Game presentation and action feedback

**Files:** Modify `GamePlay.tsx`, `ExtendedPlay.tsx`, `GameChat.tsx`, `app/globals.css`; create `src/games/presentation.ts`, `tests/game-presentation.test.mjs`.

**Interfaces:** `deriveEffects(before:VisibleState,after:VisibleState):GameEffect[]`，效果带稳定 ID、类型和目标位置；从确认后的状态差异生成，不依赖私有状态。组件仅播放新 effect ID。

- [ ] 写失败测试：落子、Reversi 翻转、memory 翻牌、match 配对、cards 出牌各生成一次效果，重复快照无效果；reflex 分数仍使用游戏自身计时成绩，不以 WebSocket 收包先后改写结果；隐藏选择不出现在效果中。
- [ ] 运行 `node --test tests/game-presentation.test.mjs`，确认失败。
- [ ] 实现 120–220ms transform/opacity 过渡、reduced-motion、按下／处理中／错误反馈；不以动画锁死下一动作。为每个 catalog 游戏检查提交、双方就绪、进度、公屏与结果提示；沿用原规则。
- [ ] 重跑表现测试及所有 `tests/*.test.mjs`，手机宽度下检查触控和公屏；提交 `feat: improve game motion and shared action feedback`。

### Task 8: End-to-end verification and free production rollout

**Files:** Create `tests/realtime-integration.mjs`, `tests/realtime-latency.mjs`; modify `scripts/deploy-pages-api.mjs`, `.github/workflows/cloudflare.yml`, `README.md` only as needed for realtime binding deployment and documented rollback.

**Interfaces:** `TEST_ORIGIN`、`TEST_FRONTEND_ORIGIN` 指定环境；测试自己生成两把钥匙并配对，禁止记录私钥。latency 脚本报告网络条件、样本数、median/P95/max，不能以发送时间替代对端接收时间。

- [ ] 写集成脚本断言两个独立客户端升级成功、未抬笔收到预览、猜测／落子／聊天／邀请即时到达；验证断网、对象恢复、版本缺口、退出换成员；20 游戏现有集成测试保持通过。
- [ ] 本地同时运行独立 DO Worker 与 API，使用隔离 `.wrangler/qa-realtime` 数据目录；先运行集成脚本确认未完成路径失败，再修复并取得全部通过。不得在集成运行中修改触发重启。
- [ ] 运行 `node --test tests/*.test.mjs`、`node node_modules/typescript/bin/tsc --noEmit`、`node node_modules/vite/bin/vite.js build --config vite.github.config.ts`、`node scripts/build-cloudflare.mjs build`，保存结果；运行既有 integration、media-integration、game-experience-integration。
- [ ] 用两个独立客户端连续绘画和至少 100 个小消息测试延迟；受控环境 RTT≤100ms、无丢包时确认 P95≤250ms，超标先定位并修复。浏览器实际检查连续画线、动画、好友邀请和窄屏，记录无法实测的真实手机／微信条件。
- [ ] 完成全分支独立审查并修复发现的问题；核对 Workers Free/SQLite、无付费升级，先 `wrangler deploy --config wrangler.realtime.jsonc`，后构建部署 Pages API；在正式 API 重跑两客户端升级／秘密过滤／邀请测试。
- [ ] 提交最终集成与文档，推送前端到原 GitHub 仓库 main 触发现有 Pages 流程；确认 workflow 成功、新 asset 与主页面 200，浏览器正式页面正常。失败按 README 回滚前端/API，保留 D1 与 DO 存储。
- [ ] 最终报告正式链接、确认的同步行为、测量数据与未验证条件；不宣称所有网络等同商业 App 体验。

## Self-review and execution handoff

设计各项分别由 Task 1–3（权限及服务）、4（恢复）、5（绘画）、6（邀请）、7（游戏反馈）、8（验证发布）覆盖。Review Focus 五项已落到所属测试。无依赖包安装或收费服务步骤；所有持久修改延用 CAS 与请求 ID 去重。

推荐 Native：由当前助手按依赖顺序完成，最后独立审查整个分支。各任务共享协议和状态接口，串行实施便于控制兼容性，也减少逐任务启动独立上下文的开销。用户确认本文及执行方式后再开始产品代码修改。
