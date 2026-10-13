import assert from 'node:assert/strict';import sharp from 'sharp';import {createHash} from 'node:crypto';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:8797',origin=process.env.TEST_FRONTEND_ORIGIN||'http://127.0.0.1:5190',keys=[],photoIds=[];
async function req(p,path,body){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,Authorization:'Bearer '+(keys[p]||''),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(120000)});const d=await r.json();assert.equal(r.status,200,`${path}: ${d.error||r.status}`);return d;}
const mine=p=>req(p,'/api/base/mine'),cmd=async(p,op,payload={})=>req(p,'/api/base/action',{op,payload,version:(await mine(p)).version,requestId:crypto.randomUUID()});
for(let p=0;p<3;p++)keys.push((await req(p,'/api/key',{action:'create'})).key);
try{
 const c=await req(0,'/api/base/create',{nick:'测试兔',name:'临时网站验收'}),j=await req(1,'/api/base/join',{nick:'测试狐',code:c.inviteCode});await req(0,'/api/base/confirm',{joinId:j.joinId});
 const pixels=Buffer.alloc(1600*1800*3);let random=42;for(let i=0;i<pixels.length;i++){random=(Math.imul(random,1664525)+1013904223)>>>0;pixels[i]=random>>>24;}
 for(const [format,mime] of [['jpeg','image/jpeg'],['png','image/png'],['webp','image/webp']]){
  const full=await sharp(pixels,{raw:{width:1600,height:1800,channels:3}})[format](format==='jpeg'?{quality:94}:format==='webp'?{quality:94}:{compressionLevel:0}).withMetadata().toBuffer();assert.ok(full.length<10*1024*1024);if(format==='png')assert.ok(full.length>2_000_000);
  const preview=await sharp(full).resize({width:960,height:960,fit:'inside'}).jpeg({quality:60}).toBuffer();assert.ok(preview.length<=300*1024);
  const form=new FormData();form.set('original','1');form.set('photo',new Blob([full],{type:mime}),'original.'+format);form.set('preview',new Blob([preview],{type:'image/jpeg'}),'preview.jpg');
  const uploaded=await fetch(base+'/api/base/photo',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+keys[0],'X-Photo-Caption':encodeURIComponent('原图格式验收')},body:form,signal:AbortSignal.timeout(120000)});assert.equal(uploaded.status,200,await uploaded.clone().text());const id=(await uploaded.json()).id;photoIds.push(id);
  const read=await fetch(base+'/api/base/photo/'+id,{headers:{Origin:origin,Authorization:'Bearer '+keys[1]},signal:AbortSignal.timeout(120000)});assert.equal(read.status,200);assert.equal(read.headers.get('content-type'),mime);const output=Buffer.from(await read.arrayBuffer());assert.equal(createHash('sha256').update(output).digest('hex'),createHash('sha256').update(full).digest('hex'));
  const small=await fetch(base+'/api/base/photo/'+id+'?preview=1',{headers:{Origin:origin,Authorization:'Bearer '+keys[1]}});assert.equal(small.status,200);const info=await sharp(Buffer.from(await small.arrayBuffer())).metadata();assert.equal(info.height,960);assert.equal(info.width,853);
  for(const query of ['','?preview=1'])assert.equal((await fetch(base+'/api/base/photo/'+id+query,{headers:{Origin:origin,Authorization:'Bearer '+keys[2]}})).status,403);
  await req(0,'/api/base/photo-delete',{id});photoIds.splice(photoIds.indexOf(id),1);assert.equal((await fetch(base+'/api/base/photo/'+id,{headers:{Origin:origin,Authorization:'Bearer '+keys[1]}})).status,404);
  console.log(`PASS ${format} original ${full.length} bytes: exact hash, 960px preview, private access, paired deletion`);
 }
 await cmd(0,'message',{text:'验收留言一'});await cmd(0,'message',{text:'验收留言二'});let messages=(await mine(1)).room.messages;await cmd(1,'message-read',{ids:[messages[0].id]});messages=(await mine(0)).room.messages;assert.deepEqual(messages.map(m=>m.read[1]),[true,false]);console.log('PASS individual mailbox read receipts');
 for(const id of ['mines','circuit','dots']){
  await cmd(0,'game-create',{id});const game=(await mine(1)).room.game;await cmd(1,'game-accept',{gameId:game.id});const s=(await mine(0)).room.game.state;
  if(id==='mines')await cmd(0,'game-action',{gameId:game.id,cell:0,mode:'reveal'});if(id==='circuit')await cmd(0,'game-action',{gameId:game.id,cell:0,round:0});if(id==='dots')await cmd(0,'game-action',{gameId:game.id,cell:0});
  const a=(await mine(0)).room.game,b=(await mine(1)).room.game;assert.deepEqual(a.state,b.state);assert.ok(a.chat.some(m=>m.kind==='system'));assert.equal(b.state.adventure.seed,undefined);assert.equal(b.state.adventure.mines,undefined);assert.equal(b.state.adventure.solution,undefined);await cmd(1,'game-chat',{gameId:game.id,text:'同步验收'});assert.ok((await mine(0)).room.game.chat.some(m=>m.text==='同步验收'));await cmd(0,'game-resign');console.log(`PASS ${id}: invite, accept, shared move, hidden info, chat`);
 }
}finally{for(const id of photoIds)await req(0,'/api/base/photo-delete',{id}).catch(()=>{});for(const p of [0,1])await req(p,'/api/base/leave',{}).catch(()=>{});}
