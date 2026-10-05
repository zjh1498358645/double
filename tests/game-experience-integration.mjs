import assert from 'node:assert/strict';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:8788',origin=process.env.TEST_FRONTEND_ORIGIN||base,fixture=process.env.QA_FIXTURE==='1';
if(fixture&&!base.startsWith('http://127.0.0.1:'))throw Error('Fixture keys are local only');
const keys=fixture?['1'.repeat(64),'2'.repeat(64)]:[];
async function req(p,path,body){const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,Authorization:'Bearer '+(keys[p]||''),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const d=await res.json();assert.ok(res.ok,`${path}: ${res.status} ${d.error||''}`);return d;}
if(!fixture)for(let p=0;p<2;p++)keys.push((await req(p,'/api/key',{action:'create'})).key);
const mine=p=>req(p,'/api/base/mine');const cmd=async(p,op,payload={})=>req(p,'/api/base/action',{op,payload,version:(await mine(p)).version,requestId:crypto.randomUUID()});
const c=await req(0,'/api/base/create',{nick:'画画兔兔',name:'手绘公屏测试小屋'}),j=await req(1,'/api/base/join',{nick:'猜猜狐狐',code:c.inviteCode});await req(0,'/api/base/confirm',{joinId:j.joinId});
await cmd(0,'game-create',{id:'draw'});await cmd(1,'game-accept');let g=(await mine(0)).room.game;
const stroke={id:crypto.randomUUID(),color:3,width:8,tool:'pen',points:[[20,30],[400,100],[600,650]]};
await cmd(0,'game-action',{gameId:g.id,stroke,round:0});assert.deepEqual((await mine(1)).room.game.state.extra.strokes,[stroke]);assert.equal((await mine(1)).room.game.state.extra.word,undefined);
await cmd(1,'game-chat',{gameId:g.id,text:'我看见蓝色线条啦'});await cmd(1,'game-action',{gameId:g.id,guess:'不知道',round:0});g=(await mine(0)).room.game;assert.ok(g.chat.some(m=>m.kind==='guess'&&m.text==='不知道'));
await cmd(0,'game-action',{gameId:g.id,drawing:'undo',round:0});assert.equal((await mine(1)).room.game.state.extra.strokes.length,0);
await cmd(0,'game-action',{gameId:g.id,stroke:{...stroke,id:crypto.randomUUID(),tool:'eraser'},round:0});await cmd(0,'game-action',{gameId:g.id,drawing:'clear',round:0});assert.equal((await mine(1)).room.game.state.extra.strokes.length,0);
await cmd(1,'game-action',{gameId:g.id,guess:g.state.extra.word,round:0});assert.equal((await mine(1)).room.game.state.extra.round,1);console.log('PASS freehand sync, private word, public guesses, undo/eraser/clear, role exchange');
await cmd(0,'game-resign');await cmd(0,'game-create',{id:'escape'});await cmd(1,'game-accept');g=(await mine(0)).room.game;await cmd(0,'game-chat',{gameId:g.id,text:'一起交换线索开锁'});
for(let i=0;i<3;i++){const a=(await mine(0)).room.game.state.extra.hint,b=(await mine(1)).room.game.state.extra.hint;const guess=a.split('').map((v,i)=>v==='·'?b[i]:v).join('');await cmd(i%2,'game-action',{gameId:g.id,guess});}assert.equal((await mine(1)).room.game.status,'finished');console.log('PASS escape solved using complementary clues and chat');
await cmd(0,'game-create',{id:'liar'});await cmd(1,'game-accept');await cmd(0,'game-action',{statements:['会游泳','会画画','会飞'],choice:2});await cmd(1,'game-action',{choice:0});assert.ok((await mine(1)).room.game.chat.at(-1).text.includes('会飞'));console.log('PASS liar reveals after guessing');
if(fixture){await cmd(0,'game-resign');await cmd(0,'game-create',{id:'draw'});await cmd(1,'game-accept');console.log('LOCAL DRAWING UI FIXTURE READY');}else {await req(1,'/api/base/leave',{});await req(0,'/api/base/leave',{});}
