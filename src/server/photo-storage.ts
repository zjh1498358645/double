const CHUNK_BYTES=512*1024;
const MAX_ORIGINAL_BYTES=10*1024*1024;
type StoredBytes=number[]|ArrayBuffer|Uint8Array;
function asBytes(data:StoredBytes){return data instanceof ArrayBuffer?new Uint8Array(data):new Uint8Array(data);}
export function photoContentType(key:string){return key.endsWith('.webp')?'image/webp':key.endsWith('.jpg')?'image/jpeg':'image/png';}

export async function savePhoto(db:D1Database,bucket:R2Bucket|undefined,key:string,data:Uint8Array,{original=false}:{original?:boolean}={}){
 if(original&&(!data.length||data.length>MAX_ORIGINAL_BYTES))throw Error('原图最大10MB');
 if(bucket){await bucket.put(key,data,{httpMetadata:{contentType:photoContentType(key)}});return;}
 if(!original){if(data.length>1900*1024)throw Error('图片过大，请再压缩一些');await db.prepare('INSERT INTO photo_objects(key,data) VALUES(?,?)').bind(key,data).run();return;}
 const exists=await db.prepare('SELECT key FROM photo_objects WHERE key=? UNION ALL SELECT key FROM photo_chunks WHERE key=? LIMIT 1').bind(key,key).first();
 if(exists)throw Error('照片已经存在');
 const count=Math.ceil(data.length/CHUNK_BYTES);
 try{
  // Bound each D1 request as well as every row. D1 serializes BLOB bindings as
  // numeric arrays, so batching an entire 10MB photograph can exhaust memory.
  for(let index=0;index<count;index+=2){
   const statements=[];
   for(let i=index;i<Math.min(index+2,count);i++)statements.push(db.prepare('INSERT INTO photo_chunks(key,chunk_index,chunk_count,total_bytes,data) VALUES(?,?,?,?,?)').bind(key,i,count,data.length,data.subarray(i*CHUNK_BYTES,Math.min((i+1)*CHUNK_BYTES,data.length))));
   await db.batch(statements);
  }
 }catch(error){await db.prepare('DELETE FROM photo_chunks WHERE key=?').bind(key).run();throw error;}
}

export async function loadPhoto(db:D1Database,bucket:R2Bucket|undefined,key:string):Promise<BodyInit|null>{
 if(bucket){const object=await bucket.get(key);return object?.body||null;}
 const legacy=await db.prepare('SELECT data FROM photo_objects WHERE key=?').bind(key).first<{data:StoredBytes}>();
 if(legacy)return asBytes(legacy.data);
 const meta=await db.prepare('SELECT COUNT(*) AS stored_chunks, MIN(chunk_count) AS chunk_count, MAX(chunk_count) AS max_count, MIN(total_bytes) AS total_bytes, MAX(total_bytes) AS max_bytes, SUM(length(data)) AS stored_bytes, MIN(chunk_index) AS first_index, MAX(chunk_index) AS last_index FROM photo_chunks WHERE key=?').bind(key).first<{stored_chunks:number;chunk_count:number;max_count:number;total_bytes:number;max_bytes:number;stored_bytes:number;first_index:number;last_index:number}>();
 if(!meta?.stored_chunks)return null;
 if(meta.total_bytes<1||meta.total_bytes>MAX_ORIGINAL_BYTES||meta.total_bytes!==meta.max_bytes||meta.total_bytes!==meta.stored_bytes||meta.chunk_count!==Math.ceil(meta.total_bytes/CHUNK_BYTES)||meta.chunk_count!==meta.max_count||meta.stored_chunks!==meta.chunk_count||meta.first_index!==0||meta.last_index!==meta.chunk_count-1)throw Error('原图存档不完整，请重新上传');
 let index=0;
 return new ReadableStream<Uint8Array>({async pull(controller){
  try{
   const row=await db.prepare('SELECT data FROM photo_chunks WHERE key=? AND chunk_index=?').bind(key,index).first<{data:StoredBytes}>();
   if(!row)throw Error('原图存档不完整，请重新上传');
   const chunk=asBytes(row.data),expected=Math.min(CHUNK_BYTES,meta.total_bytes-index*CHUNK_BYTES);
   if(chunk.length!==expected)throw Error('原图存档不完整，请重新上传');
   controller.enqueue(chunk);index++;if(index===meta.chunk_count)controller.close();
  }catch(error){controller.error(error);}
 }});
}

export async function deletePhoto(db:D1Database,bucket:R2Bucket|undefined,key:string){
 if(bucket){await bucket.delete(key);return;}
 await db.batch([db.prepare('DELETE FROM photo_objects WHERE key=?').bind(key),db.prepare('DELETE FROM photo_chunks WHERE key=?').bind(key)]);
}
