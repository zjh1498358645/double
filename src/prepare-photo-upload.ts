import {preparePhoto} from './prepare-photo';
// Two independently encoded sizes: never enlarge or crop the source.
export async function preparePhotoUpload(file:File,standalone:boolean):Promise<Blob|FormData>{
 if(!standalone)return preparePhoto(file,false);
 if(file.size>10*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('支持JPEG、PNG、WebP，单张最大10MB');
 const bitmap=await createImageBitmap(file);
 try{
  async function encode(edge:number,qualities:number[],limit:number){
   const scale=Math.min(1,edge/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('图片处理失败');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   for(const quality of qualities){const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('图片处理失败')),'image/jpeg',quality));if(blob.size<=limit)return blob;}
   throw Error('这张照片细节太多，请选择小于3200像素的版本；不会自动压成模糊小图');
  }
  const full=await encode(3200,[.96,.94,.92,.90,.88],1900*1024),preview=await encode(480,[.88,.84,.8],100*1024);
  const form=new FormData();form.set('photo',full,'photo.jpg');form.set('preview',preview,'preview.jpg');return form;
 }finally{bitmap.close();}
}
