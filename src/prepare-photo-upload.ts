import {preparePhoto} from './prepare-photo.ts';
// Keep the original file byte-for-byte; encode only the lightweight preview.
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
   throw Error('照片预览生成失败，请重新选择这张原图');
  }
  if(bitmap.width>16384||bitmap.height>16384||bitmap.width*bitmap.height>80_000_000)throw Error('照片尺寸过大，请选择8000万像素以内的原图');
  let preview:Blob;
  try{preview=await encode(960,[.94,.9,.86,.82],300*1024);}catch{preview=await encode(720,[.94,.9,.86,.82,.75],300*1024);}
  const form=new FormData();form.set('original','1');form.set('photo',file,file.name);form.set('preview',preview,'preview.jpg');return form;
 }finally{bitmap.close();}
}
