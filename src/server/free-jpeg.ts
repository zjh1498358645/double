// Validate bounded canvas JPEG framing and strip metadata without decoding pixels.
export function freeJPEG(input:Uint8Array):Uint8Array{
 if(input.length>1024*1024||input.length<20||input[0]!==255||input[1]!==216)throw Error('照片格式无效，压缩后须小于1MB');
 const parts:Uint8Array[]=[input.slice(0,2)];let offset=2,frame=false,scan=false,end=false;
 while(offset<input.length){const start=offset;if(input[offset++]!==255)throw Error('JPEG标记无效');while(input[offset]===255)offset++;const marker=input[offset++];
  if(marker===217){if(!frame||!scan||offset!==input.length)throw Error('JPEG结尾无效');parts.push(input.slice(start,offset));end=true;break;}
  if(marker===216||marker===0||marker===1||marker>=208&&marker<=215||offset+2>input.length)throw Error('JPEG结构无效');
  const length=input[offset]*256+input[offset+1],next=offset+length;if(length<2||next>input.length)throw Error('JPEG不完整');
  if(marker>=192&&marker<=207&&![196,200,204].includes(marker)){
   if(frame||![192,194].includes(marker)||length<11||input[offset+2]!==8)throw Error('照片编码不支持');
   const h=input[offset+3]*256+input[offset+4],w=input[offset+5]*256+input[offset+6],channels=input[offset+7];if(!w||!h||w>1600||h>1600||![1,3].includes(channels)||length!==8+3*channels)throw Error('请从相册选择照片，自动压缩到1600像素');frame=true;
  }
  if(!(marker>=224&&marker<=239)&&marker!==254)parts.push(input.slice(start,next));offset=next;
  if(marker===218){if(!frame||length<6)throw Error('JPEG扫描无效');scan=true;const entropy=offset;while(offset<input.length){if(input[offset]!==255){offset++;continue;}const m=input[offset+1];if(m===0||m>=208&&m<=215){offset+=2;continue;}break;}parts.push(input.slice(entropy,offset));}
 }
 if(!end)throw Error('JPEG不完整');const output=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){output.set(p,at);at+=p.length;}return output;
}
