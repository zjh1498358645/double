import assert from 'node:assert/strict';
import sharp from 'sharp';
const base=process.env.TEST_ORIGIN||'http://127.0.0.1:8790',origin=process.env.TEST_FRONTEND_ORIGIN||base;
const keys=[];let id;
async function req(p,path,body){const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,Authorization:'Bearer '+(keys[p]||''),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(60000)});const data=await res.json();assert.equal(res.status,200,`${path}: ${data.error||res.status}`);return data;}
for(let p=0;p<3;p++)keys.push((await req(p,'/api/key',{action:'create'})).key);
try{
 const c=await req(0,'/api/base/create',{nick:'照片验收兔',name:'临时相册验收'}),j=await req(1,'/api/base/join',{nick:'照片验收狐',code:c.inviteCode});await req(0,'/api/base/confirm',{joinId:j.joinId});
 const pixels=Buffer.alloc(2400*3200*3);for(let i=0;i<pixels.length;i++)pixels[i]=Math.min(255,Math.floor((i%7200)/7200*240)+(i*17%9));
 const full=await sharp(pixels,{raw:{width:2400,height:3200,channels:3}}).jpeg({quality:94}).withMetadata().toBuffer();assert.ok(full.length<1900*1024);
 const preview=await sharp(full).resize({width:480,height:480,fit:'inside'}).jpeg({quality:88}).toBuffer();
 const form=new FormData();form.set('photo',new Blob([full],{type:'image/jpeg'}),'full.jpg');form.set('preview',new Blob([preview],{type:'image/jpeg'}),'preview.jpg');
 const upload=await fetch(base+'/api/base/photo',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+keys[0],'X-Photo-Caption':encodeURIComponent('高清竖图验收')},body:form,signal:AbortSignal.timeout(60000)});assert.equal(upload.status,200,await upload.clone().text());id=(await upload.json()).id;
 const photo=(await req(1,'/api/base/mine')).room.photos.find(p=>p.id===id);assert.equal(photo.preview,true);
 for(const [query,w,h] of [['',2400,3200],['?preview=1',360,480]]){
  const read=await fetch(base+'/api/base/photo/'+id+query,{headers:{Origin:origin,Authorization:'Bearer '+keys[1]},signal:AbortSignal.timeout(60000)});assert.equal(read.status,200);const blob=Buffer.from(await read.arrayBuffer()),info=await sharp(blob).metadata();assert.equal(info.width,w);assert.equal(info.height,h);assert.equal(info.exif,undefined);console.log('PASS '+(query?'preview':'full')+': '+w+'x'+h+', '+blob.length+' bytes');
  const foreign=await fetch(base+'/api/base/photo/'+id+query,{headers:{Origin:origin,Authorization:'Bearer '+keys[2]}});assert.equal(foreign.status,403);
 }
 await req(0,'/api/base/photo-delete',{id});
 for(const query of ['', '?preview=1'])assert.equal((await fetch(base+'/api/base/photo/'+id+query,{headers:{Origin:origin,Authorization:'Bearer '+keys[1]}})).status,404);
 console.log('PASS member-only reads, proportional previews, metadata stripping, paired deletion');
}finally{for(const p of [0,1])await req(p,'/api/base/leave',{});}
