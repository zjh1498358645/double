import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {savePhoto,loadPhoto,deletePhoto} from '../src/server/photo-storage.ts';

// Real SQLite executes every query. The adapter mirrors D1's numeric-array BLOB
// results and bounded rows; injected SQL failures exercise partial-write cleanup.
function database(){
 const sql=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 let writes=0,failAt=Infinity;
 function row(value){if(!value)return null;return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,v instanceof Uint8Array?Array.from(v):v]));}
 const db={sql,failAfter(n){failAt=writes+n;},prepare(query){let args=[];function execute(){if(query.startsWith('INSERT')&&++writes===failAt)throw Error('injected database write failure');for(const value of args)if(value instanceof Uint8Array&&value.byteLength>1_999_000)throw Error('D1 row exceeds 2MB');return {success:true,meta:{changes:Number(sql.prepare(query).run(...args).changes)}};}return {bind(...values){args=values;return this;},async first(){return row(sql.prepare(query).get(...args));},async all(){return {success:true,results:sql.prepare(query).all(...args).map(row)};},async run(){return execute();},_execute:execute};},async batch(statements){sql.exec('BEGIN');try{const results=statements.map(s=>s._execute());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}};
 return db;
}
async function read(db,key){const body=await loadPhoto(db,undefined,key);return body===null?null:new Uint8Array(await new Response(body).arrayBuffer());}
const digest=data=>createHash('sha256').update(data).digest('hex');

test('originals larger than D1 row limit roundtrip exactly through bounded chunks',async()=>{
 const db=database(),input=new Uint8Array(10*1024*1024);for(let i=0;i<input.length;i++)input[i]=(i*29+Math.floor(i/1024))%256;
 try{await savePhoto(db,undefined,'photos/original.png',input,{original:true});assert.equal(digest(await read(db,'photos/original.png')),digest(input));const rows=db.sql.prepare('SELECT length(data) AS size FROM photo_chunks').all();assert.ok(rows.length>1);assert.ok(rows.every(r=>r.size<=512*1024));assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM photo_objects').get().n,0);}finally{db.sql.close();}
});

test('legacy photo URLs stay readable and deletion removes both storage formats',async()=>{
 const db=database();try{const legacy=new Uint8Array([1,2,3]),original=new Uint8Array(2_100_000).fill(27);await savePhoto(db,undefined,'photos/old.jpg',legacy);await savePhoto(db,undefined,'photos/new.webp',original,{original:true});assert.deepEqual(await read(db,'photos/old.jpg'),legacy);await deletePhoto(db,undefined,'photos/old.jpg');await deletePhoto(db,undefined,'photos/new.webp');assert.equal(await read(db,'photos/old.jpg'),null);assert.equal(await read(db,'photos/new.webp'),null);assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM photo_chunks').get().n,0);}finally{db.sql.close();}
});

test('failed later chunk writes remove earlier batches without touching existing photos',async()=>{
 const db=database();try{await savePhoto(db,undefined,'photos/keep.jpg',new Uint8Array([4,5,6]));db.failAfter(4);await assert.rejects(savePhoto(db,undefined,'photos/interrupted.jpg',new Uint8Array(3_000_000),{original:true}),/injected/);assert.equal(await read(db,'photos/interrupted.jpg'),null);assert.deepEqual(await read(db,'photos/keep.jpg'),new Uint8Array([4,5,6]));assert.equal(db.sql.prepare('SELECT COUNT(*) AS n FROM photo_chunks').get().n,0);}finally{db.sql.close();}
});

test('incomplete originals and uploads over 10MiB never return a shortened photograph',async()=>{
 const db=database();try{await assert.rejects(savePhoto(db,undefined,'photos/oversized.jpg',new Uint8Array(10*1024*1024+1),{original:true}));await savePhoto(db,undefined,'photos/broken.jpg',new Uint8Array(2_100_000),{original:true});db.sql.prepare('DELETE FROM photo_chunks WHERE key=? AND chunk_index=1').run('photos/broken.jpg');await assert.rejects(read(db,'photos/broken.jpg'),/完整|incomplete/);}finally{db.sql.close();}
});
