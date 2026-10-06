import {Miniflare} from 'miniflare';
import {build} from 'esbuild';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),database='9a1d30b5-24d2-473a-9826-42c8e91b47a2';
const compiled=await build({entryPoints:['workers/realtime.ts'],bundle:true,write:false,format:'esm',platform:'neutral',target:'es2022'});
const serverRoot=path.join(root,'dist/server'),files=(await readdir(serverRoot,{recursive:true})).filter(file=>file.endsWith('.js')).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:a.localeCompare(b)),modules=files.map(file=>({type:'ESModule',path:path.join(serverRoot,file)}));
const mf=new Miniflare({host:'127.0.0.1',port:8788,d1Persist:path.join(root,'.wrangler/qa-realtime-direct/d1'),durableObjectsPersist:path.join(root,'.wrangler/qa-realtime-direct/do'),workers:[
 {name:'double-secret-base',modules,modulesRoot:serverRoot,compatibilityDate:'2026-05-22',compatibilityFlags:['nodejs_compat'],bindings:{AUTH_MODE:'key',PUBLIC_ORIGINS:'https://zjh1498358645.github.io'},d1Databases:{DB:database},durableObjects:{ROOM_REALTIME:{className:'RoomRealtime',scriptName:'double-secret-base-realtime',useSQLite:true}},assets:{directory:path.join(root,'dist/client'),binding:'ASSETS',routerConfig:{has_user_worker:true,invoke_user_worker_ahead_of_assets:true}}},
 {name:'double-secret-base-realtime',modules:true,script:compiled.outputFiles[0].text,compatibilityDate:'2026-05-22',d1Databases:{DB:database},durableObjects:{ROOM_REALTIME:{className:'RoomRealtime',useSQLite:true}}}
]});
await mf.ready;if(!process.env.QA_SKIP_MIGRATIONS){const db=await mf.getD1Database('DB','double-secret-base');const present=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rooms'").first();if(!present){for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){const sql=await readFile(path.join('drizzle',file),'utf8');for(const statement of sql.split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(statement).run();}}
}
console.log('REALTIME QA READY http://127.0.0.1:8788 (direct Miniflare; isolated local data)');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await mf.dispose();process.exit(0);});
