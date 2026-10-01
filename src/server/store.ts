import {newRoom,transition,snapshot,type Room} from './model.ts';
import type {Slot} from '../games/engine.ts';
export type Actor={userId:string};
export class AppError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status;}}
type Row={id:string;data:string;version:number;invite_hash:string|null};
type Membership={room_id:string;slot:Slot};
async function hash(code:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code.trim().toUpperCase())))].map(v=>v.toString(16).padStart(2,'0')).join('');}
function invitation(){return [...crypto.getRandomValues(new Uint8Array(6))].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();}
export class BaseStore{
 db:D1Database;now:()=>number;
 constructor(db:D1Database,now:()=>number=()=>Date.now()){this.db=db;this.now=now;}
 async membership(a:Actor){return this.db.prepare('SELECT room_id,slot FROM members WHERE user_id=?').bind(a.userId).first<Membership>();}
 async raw(id:string){const row=await this.db.prepare('SELECT * FROM rooms WHERE id=?').bind(id).first<Row>();if(!row)throw new AppError('小屋不存在',404);return row;}
 async mine(a:Actor){const m=await this.membership(a);if(m){const row=await this.raw(m.room_id);return {roomId:row.id,version:row.version,room:snapshot(JSON.parse(row.data),m.slot,this.now()),pending:null};}
  const row=await this.db.prepare("SELECT id,data FROM rooms WHERE EXISTS (SELECT 1 FROM json_each(data,'$.pending') WHERE json_extract(value,'$.user')=?) LIMIT 1").bind(a.userId).first<Row>();
  return {roomId:null,version:0,room:null,pending:row?{roomName:(JSON.parse(row.data) as Room).name}:null};
 }
 async create(a:Actor,nick:string,name:string){if(await this.membership(a))throw new AppError('你已经有一个小屋了');const id=crypto.randomUUID(),r=newRoom(a.userId,nick,name,this.now()),code=invitation();r.inviteHash=await hash(code);r.inviteUntil=this.now()+86400000;
  try{await this.db.batch([this.db.prepare('INSERT INTO rooms(id,data,version,invite_hash) VALUES(?,?,0,?)').bind(id,JSON.stringify(r),r.inviteHash),this.db.prepare('INSERT INTO members(user_id,room_id,slot) VALUES(?,?,0)').bind(a.userId,id)]);}catch{throw new AppError('你已经创建或加入了小屋，请刷新',409);}return {roomId:id,inviteCode:code};
 }
 async join(a:Actor,code:string,nick:string){if(await this.membership(a))throw new AppError('你已经有一个小屋了');if(typeof code!=='string'||!/^[A-Fa-f0-9]{12}$/.test(code.trim()))throw new AppError('邀请码是12位字母和数字');if(typeof nick!=='string'||!nick.trim()||nick.length>20)throw new AppError('昵称需要1到20字');
  const h=await hash(code),row=await this.db.prepare('SELECT * FROM rooms WHERE invite_hash=?').bind(h).first<Row>();if(!row)throw new AppError('邀请码无效或已撤销');const r:Room=JSON.parse(row.data);if(r.inviteUntil<=this.now()||r.members[1]||r.members[0].id===a.userId)throw new AppError('邀请已过期、已配对，或不能加入自己的小屋');
  const prior=r.pending.find(p=>p.user===a.userId);if(prior)return {joinId:prior.id};if(r.pending.length>=5)throw new AppError('邀请请求较多，请稍后再试');const joinId=crypto.randomUUID();r.pending.push({id:joinId,user:a.userId,name:nick.trim()});await this.commit(row,r);return {joinId};
 }
 async confirm(a:Actor,joinId:string){const m=await this.membership(a);if(!m||m.slot!==0)throw new AppError('只有创建者可以确认配对',403);const row=await this.raw(m.room_id),r:Room=JSON.parse(row.data),p=r.pending.find(p=>p.id===joinId);if(r.members[1]||!p||r.inviteUntil<=this.now())throw new AppError('邀请已失效');r.members[1]={id:p.user,name:p.name};r.pending=[];r.inviteHash='';r.inviteUntil=0;
  try{await this.commit(row,r,a,[this.db.prepare('INSERT INTO members(user_id,room_id,slot) SELECT ?,?,1 WHERE changes()>0').bind(p.user,row.id)]);}catch(e){if(e instanceof AppError)throw e;throw new AppError('对方已加入其他小屋，请刷新',409);}return {ok:true};
 }
 async renew(a:Actor){const m=await this.membership(a);if(!m||m.slot!==0)throw new AppError('只有创建者可以生成邀请',403);const row=await this.raw(m.room_id),r:Room=JSON.parse(row.data);if(r.members[1])throw new AppError('小屋已经配对');const code=invitation();r.inviteHash=await hash(code);r.inviteUntil=this.now()+86400000;r.pending=[];await this.commit(row,r,a);return {inviteCode:code};}
 async mutate(a:Actor,op:string,payload:Record<string,unknown>,requestId:string,version:number){if(typeof requestId!=='string'||requestId.length<6||requestId.length>80||!Number.isInteger(version))throw new AppError('操作标识无效');const m=await this.membership(a);if(!m)throw new AppError('请先创建或加入小屋',403);const row=await this.raw(m.room_id),r:Room=JSON.parse(row.data);if(r.receipts.includes(requestId))return {ok:true,version:row.version};if(row.version!==version)throw new AppError('对方刚更新了小屋，刷新后再试',409);const next=transition(r,m.slot,op,payload,this.now());next.receipts.push(requestId);next.receipts=next.receipts.slice(-1000);await this.commit(row,next,a);return {ok:true,version:row.version+1};}
 async commit(row:Row,r:Room,a?:Actor,extras:D1PreparedStatement[]=[]){const q=a?'UPDATE rooms SET data=?,version=version+1,invite_hash=? WHERE id=? AND version=? AND EXISTS(SELECT 1 FROM members WHERE user_id=? AND room_id=?)':'UPDATE rooms SET data=?,version=version+1,invite_hash=? WHERE id=? AND version=?';const args:(string|number|null)[]=[JSON.stringify(r),r.inviteHash||null,row.id,row.version];if(a)args.push(a.userId,row.id);const result=await this.db.batch([this.db.prepare(q).bind(...args),...extras]);if(result[0].meta.changes!==1)throw new AppError('对方刚更新了小屋，刷新后再试',409);}
 async leave(a:Actor){const m=await this.membership(a);if(!m)throw new AppError('你不在小屋里');const row=await this.raw(m.room_id),r:Room=JSON.parse(row.data);if(r.game)r.game.status='abandoned';r.pending=[];r.inviteHash='';r.inviteUntil=0;
  const leaving=r.members[m.slot]!;for(const message of r.messages){message.authorId ||= r.members[message.author]?.id||''; (message as typeof message & {authorName?:string}).authorName=r.members[message.author]?.name||'曾经的成员';}for(const photo of r.photos){photo.authorId ||= r.members[photo.author]?.id||''; (photo as typeof photo & {authorName?:string}).authorName=r.members[photo.author]?.name||'曾经的成员';}
  const extras=[this.db.prepare('DELETE FROM members WHERE user_id=? AND changes()>0').bind(a.userId)];
  if(m.slot===0&&r.members[1]){const remaining=r.members[1];r.members=[remaining,null];r.messages.forEach(msg=>{msg.author=(1-msg.author) as Slot;msg.read.reverse();});r.photos.forEach(photo=>photo.author=(1-photo.author) as Slot);r.challenges.forEach(c=>{c.completed.reverse();c.skipped.reverse();});r.history.forEach(h=>{if(h.winner!==null)h.winner=(1-h.winner) as Slot;h.scores.reverse();});extras.push(this.db.prepare('UPDATE members SET slot=0 WHERE user_id=? AND changes()>0').bind(remaining.id));}
  else if(m.slot===1)r.members[1]=null;
  else{r.members[0]={id:'',name:leaving.name};}
  await this.commit(row,r,a,extras);return {ok:true};
 }
 async photo(a:Actor,id:string){const m=await this.membership(a);if(!m)throw new AppError('没有权限',403);const r:Room=JSON.parse((await this.raw(m.room_id)).data);const photo=r.photos.find(p=>p.id===id);if(!photo)throw new AppError('照片不存在',404);return photo;}
 async addPhoto(a:Actor,key:string,caption:string){const m=await this.membership(a);if(!m)throw new AppError('没有权限',403);const row=await this.raw(m.room_id),r:Room=JSON.parse(row.data);if(r.photos.length>=100)throw new AppError('相册已达到100张，请先删除一些照片');const id=crypto.randomUUID();r.photos.push({id,key,author:m.slot,authorId:a.userId,caption:caption.trim().slice(0,300),created:this.now()});await this.commit(row,r,a);return {id};}
 async removePhoto(a:Actor,id:string){const m=await this.membership(a);if(!m)throw new AppError('没有权限',403);const row=await this.raw(m.room_id),r:Room=JSON.parse(row.data),photo=r.photos.find(p=>p.id===id);if(!photo||photo.authorId!==a.userId)throw new AppError('只能删除自己的照片',403);r.photos=r.photos.filter(p=>p.id!==id);await this.commit(row,r,a);return photo.key;}
}

