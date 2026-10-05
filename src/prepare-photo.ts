export async function preparePhoto(file:File,standalone:boolean):Promise<Blob>{
 if(file.size>10*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('支持JPEG、PNG、WebP，单张最大10MB');
 const bitmap=await createImageBitmap(file);try{let edge=1600;while(edge>=480){const scale=Math.min(1,edge/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw Error('图片处理失败');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingQuality='high';ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  for(const quality of standalone?[.9,.82,.74,.66]:[1]){const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('图片处理失败')),standalone?'image/jpeg':'image/png',quality));if(!standalone||blob.size<=1024*1024)return blob;}edge=Math.floor(edge*.8);
 }throw Error('照片压缩失败，请换一张照片');}finally{bitmap.close();}
}
