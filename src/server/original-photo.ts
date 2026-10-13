const MAX_BYTES=10*1024*1024,MAX_SIDE=16384,MAX_PIXELS=80_000_000;
function size(width:number,height:number){if(!width||!height||width>MAX_SIDE||height>MAX_SIDE||width*height>MAX_PIXELS)throw Error('照片尺寸过大，请选择8000万像素以内的原图');return {width,height};}
function fail():never{throw Error('照片格式无效或文件不完整，请重新选择原图');}
const text=(b:Uint8Array,at:number,n:number)=>String.fromCharCode(...b.subarray(at,at+n));
export function originalPhoto(bytes:Uint8Array,mime:string){
 if(!bytes.length||bytes.length>MAX_BYTES)throw Error('原图最大10MB');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let dimensions:{width:number;height:number}|undefined,extension:string;
 if(mime==='image/jpeg'){
  extension='jpg';if(bytes.length<20||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217)fail();
  let at=2,frame=false,scan=false;
  while(at<bytes.length-2){if(bytes[at++]!==255)fail();while(bytes[at]===255)at++;const marker=bytes[at++];if(marker===217||marker===0||marker===216||at+2>bytes.length)fail();const length=v.getUint16(at),end=at+length;if(length<2||end>bytes.length-2)fail();
   if(marker>=192&&marker<=207&&![196,200,204].includes(marker)){if(frame||![192,194].includes(marker)||length<11||bytes[at+2]!==8)fail();const channels=bytes[at+7];if(![1,3,4].includes(channels)||length!==8+3*channels)fail();dimensions=size(v.getUint16(at+5),v.getUint16(at+3));frame=true;}
   if(marker===218){if(!frame||length<6)fail();scan=true;break;}at=end;
  }if(!frame||!scan)fail();
 }else if(mime==='image/png'){
  extension='png';if(bytes.length<45||![137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n))fail();let at=8,image=false,ended=false;
  while(at<bytes.length){if(at+12>bytes.length)fail();const length=v.getUint32(at),end=at+length+12;if(end>bytes.length)fail();const kind=text(bytes,at+4,4);
   if(kind==='IHDR'){if(at!==8||length!==13||dimensions)fail();dimensions=size(v.getUint32(at+8),v.getUint32(at+12));if(![1,2,4,8,16].includes(bytes[at+16])||![0,2,3,4,6].includes(bytes[at+17])||bytes[at+18]!==0||bytes[at+19]!==0||bytes[at+20]>1)fail();}
   if(kind==='IDAT'){if(!dimensions||!length)fail();image=true;}
   if(kind==='IEND'){if(!dimensions||!image||length!==0||end!==bytes.length)fail();ended=true;}
   at=end;
  }if(!ended)fail();
 }else if(mime==='image/webp'){
  extension='webp';if(bytes.length<20||text(bytes,0,4)!=='RIFF'||text(bytes,8,4)!=='WEBP'||v.getUint32(4,true)!==bytes.length-8)fail();let at=12,image=false;
  while(at<bytes.length){if(at+8>bytes.length)fail();const kind=text(bytes,at,4),length=v.getUint32(at+4,true),payload=at+8,end=payload+length;if(end>bytes.length)fail();
   if(kind==='VP8X'){if(length!==10)fail();dimensions=size(1+bytes[payload+4]+(bytes[payload+5]<<8)+(bytes[payload+6]<<16),1+bytes[payload+7]+(bytes[payload+8]<<8)+(bytes[payload+9]<<16));}
   if(kind==='VP8 '){if(length<10||text(bytes,payload+3,3)!=='\x9d\x01\x2a')fail();dimensions??=size(v.getUint16(payload+6,true)&16383,v.getUint16(payload+8,true)&16383);image=true;}
   if(kind==='VP8L'){if(length<5||bytes[payload]!==47)fail();const bits=v.getUint32(payload+1,true);dimensions??=size(1+(bits&16383),1+((bits>>>14)&16383));image=true;}
   if(kind==='ANMF'){if(length<16||!dimensions)fail();image=true;}
   at=end+(length%2);if(at>bytes.length)fail();
  }if(!dimensions||!image)fail();
 }else throw Error('支持JPEG、PNG、WebP原图');
 if(!dimensions)fail();return {bytes,mime,extension,...dimensions};
}
