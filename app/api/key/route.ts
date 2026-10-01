import {env} from 'cloudflare:workers';
import {newKey,keyCookie,keyIdentity} from '@/src/server/key-auth';
export async function POST(request:Request){
 if(env.AUTH_MODE!=='key')return Response.json({error:'此登录方式未启用'},{status:404});
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'请从小屋页面操作'},{status:403});
 try{if(Number(request.headers.get('content-length'))>2048)throw Error('内容太长');const reader=request.body?.getReader();let text='';if(reader){const decoder=new TextDecoder();try{while(true){const x=await reader.read();if(x.done)break;text+=decoder.decode(x.value,{stream:true});if(text.length>2048)throw Error('内容太长');}}finally{await reader.cancel();}}
 const body=JSON.parse(text);let key='';if(body.action==='create')key=newKey();else if(body.action==='login'){key=typeof body.key==='string'?body.key.replace(/[\s-]/g,'').toLowerCase():'';if(!await keyIdentity(key))throw Error('请输入完整的64位私人钥匙');}else if(body.action!=='logout')throw Error('未知操作');
 return Response.json({ok:true,key:body.action==='create'?key:undefined},{headers:{'Set-Cookie':keyCookie(key,!import.meta.env.DEV),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'没有登录成功'},{status:400,headers:{'Cache-Control':'no-store'}});}
}
