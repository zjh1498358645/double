import {permittedOrigin} from '@/src/server/origin';
import {freePhoto} from '@/src/server/free-photo';
import {freeJPEG} from '@/src/server/free-jpeg';
import {savePhoto,loadPhoto,deletePhoto} from '@/src/server/photo-storage';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {BaseStore,AppError} from '@/src/server/store';
import {normalizePNG} from '@/src/server/media';
import {issueTicket,publishRoom,notifyCommitted,roomVersion} from '@/src/server/realtime';
export const dynamic='force-dynamic';
async function setup(){const user=await getChatGPTUser();if(!user)throw new AppError('请先登录，再回到小屋',401);if(!env.DB)throw new AppError('小屋存档暂时无法连接，请稍后重试',503);return {actor:{userId:user.userId},store:new BaseStore(env.DB)};}
async function bytes(request:Request,max:number){if(Number(request.headers.get('content-length'))>max)throw new AppError('内容太大了');if(!request.body)return new Uint8Array();const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>max)throw new AppError('内容太大了');chunks.push(x.value);}}finally{await reader.cancel();}const out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}return out;}
function error(e:unknown){if(!(e instanceof AppError))console.error('base-api',e instanceof Error?e.message:'Unknown');return Response.json({error:e instanceof Error&&e.message.length<150?e.message:'保存失败，请稍后再试'},{status:e instanceof AppError?e.status:400,headers:{'Cache-Control':'no-store'}});}
export async function GET(request:Request){try{const {actor,store}=await setup();const parts=new URL(request.url).pathname.split('/').filter(Boolean),action=parts[2];if(action==='version')return Response.json(await roomVersion(env,actor),{headers:{'Cache-Control':'no-store'}});if(action==='photo'){const photo=await store.photo(actor,parts[3]);const preview=photo.preview&&new URL(request.url).searchParams.get('preview')==='1';const object=await loadPhoto(env.DB!,env.BUCKET,preview?photo.key+'.preview.jpg':photo.key);if(!object)throw new AppError('照片不存在',404);return new Response(object,{headers:{'Content-Type':preview||photo.key.endsWith('.jpg')?'image/jpeg':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
 const mine=await store.mine(actor),etag=`"${mine.roomId}:${mine.version}:${mine.room?.slot}:${mine.room?.day}:${mine.room?.game?.status}"`;if(mine.room&&request.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers:{ETag:etag,'Cache-Control':'private, no-cache'}});return Response.json(mine,{headers:{ETag:etag,'Cache-Control':'private, no-cache'}});
 }catch(e){return error(e);}}
export async function POST(request:Request){try{const origin=request.headers.get('origin');if(!permittedOrigin(request,(env as {PUBLIC_ORIGINS?:string}).PUBLIC_ORIGINS))throw new AppError('请从小屋页面操作',403);const {actor,store}=await setup();const path=new URL(request.url).pathname.split('/').filter(Boolean)[2];
 if(path==='realtime-ticket')return Response.json(await issueTicket(env,actor,origin!),{headers:{'Cache-Control':'no-store'}});
 const before=await store.membership(actor);
 if(path==='photo'){
  const mime=request.headers.get('content-type')||'',multipart=mime.startsWith('multipart/form-data;'),jpeg=mime==='image/jpeg'&&!env.BUCKET;
  if(!multipart&&mime!=='image/png'&&!jpeg)throw new AppError('请通过相册选择照片');
  let caption='';try{caption=decodeURIComponent(request.headers.get('x-photo-caption')||'');}catch{throw new AppError('照片说明无效');}
  let data:Uint8Array,preview:Uint8Array|undefined;
  if(multipart){
   const body=await bytes(request,2050*1024),form=await new Response(body,{headers:{'Content-Type':mime}}).formData();
   const full=form.get('photo'),small=form.get('preview');
   if(!(full instanceof Blob)||!(small instanceof Blob)||full.type!=='image/jpeg'||small.type!=='image/jpeg')throw new AppError('照片上传格式无效');
   data=freeJPEG(new Uint8Array(await full.arrayBuffer()),{maxSide:3200,maxBytes:1900*1024});
   preview=freeJPEG(new Uint8Array(await small.arrayBuffer()),{maxSide:480,maxBytes:100*1024});
  }else{const input=await bytes(request,env.BUCKET?10*1024*1024:1024*1024);data=env.BUCKET?normalizePNG(input):jpeg?freeJPEG(input):freePhoto(input);}
  const key=`photos/${crypto.randomUUID()}.${multipart||jpeg?'jpg':'png'}`;
  try{await savePhoto(env.DB!,env.BUCKET,key,data);if(preview)await savePhoto(env.DB!,env.BUCKET,key+'.preview.jpg',preview);
   const result=await store.addPhoto(actor,key,caption,!!preview);if(before)await notifyCommitted(()=>publishRoom(env,before.room_id));return Response.json(result);
  }catch(e){await deletePhoto(env.DB!,env.BUCKET,key);if(preview)await deletePhoto(env.DB!,env.BUCKET,key+'.preview.jpg');throw e;}
 }

 let b:Record<string,unknown>;try{b=JSON.parse(new TextDecoder().decode(await bytes(request,32000)));}catch{throw new AppError('操作内容无效');}if(!b||typeof b!=='object'||Array.isArray(b))throw new AppError('操作内容无效');let result:unknown;
 switch(path){case 'create':result=await store.create(actor,b.nick as string,b.name as string);break;case 'join':result=await store.join(actor,b.code as string,b.nick as string);break;case 'confirm':result=await store.confirm(actor,b.joinId as string);break;case 'renew':result=await store.renew(actor);break;case 'leave':result=await store.leave(actor);break;case 'photo-delete':{const key=await store.removePhoto(actor,b.id as string);await deletePhoto(env.DB!,env.BUCKET,key);await deletePhoto(env.DB!,env.BUCKET,key+'.preview.jpg');result={ok:true};break;}case 'action':result=await store.mutate(actor,b.op as string,(b.payload||{}) as Record<string,unknown>,b.requestId as string,b.version as number);break;default:throw new AppError('找不到这个操作',404);}
 const latest=await store.mine(actor);const roomId=latest.roomId||before?.room_id;if(roomId)await notifyCommitted(()=>publishRoom(env,roomId));
 if(path==='join'&&!roomId){const row=await env.DB!.prepare("SELECT id FROM rooms WHERE EXISTS (SELECT 1 FROM json_each(data,'$.pending') WHERE json_extract(value,'$.user')=?) LIMIT 1").bind(actor.userId).first<{id:string}>();if(row)await notifyCommitted(()=>publishRoom(env,row.id));}
 return Response.json({...result as Record<string,unknown>,snapshot:latest},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return error(e);}}
