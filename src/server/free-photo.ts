// Browser canvas has already resized the image. Validate bounded PNG structure
// and remove metadata without expensive server-side decoding on Workers Free.
const signature=[137,80,78,71,13,10,26,10];
const crcTable=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c;}
function crc(data:Uint8Array){let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
export function freePhoto(input:Uint8Array){
 if(input.length>1024*1024||input.length<45||signature.some((v,i)=>input[i]!==v))throw Error('请从相册选择图片，压缩后最大1MB');
 const view=new DataView(input.buffer,input.byteOffset,input.byteLength),chunks:Uint8Array[]=[input.slice(0,8)];let offset=8,header=false,image=false,end=false;
 while(offset<input.length){if(offset+12>input.length)throw Error('图片不完整');const length=view.getUint32(offset),next=offset+length+12;if(next>input.length)throw Error('图片不完整');const type=String.fromCharCode(...input.subarray(offset+4,offset+8));if(crc(input.subarray(offset+4,next-4))!==view.getUint32(next-4))throw Error('图片校验失败');
 if(type==='IHDR'){if(header||offset!==8||length!==13)throw Error('图片头无效');const w=view.getUint32(offset+8),h=view.getUint32(offset+12);if(!w||!h||w>480||h>480||input[offset+16]!==8||![2,6].includes(input[offset+17])||input[offset+18]!==0||input[offset+19]!==0||input[offset+20]!==0)throw Error('请用相册重新选择图片，会自动压缩');header=true;}
 else if(type==='IDAT'){if(!header||end)throw Error('图片内容无效');image=true;}
 else if(type==='IEND'){if(!image||length!==0||next!==input.length)throw Error('图片结尾无效');end=true;}
 else if(type[0]===type[0].toUpperCase())throw Error('图片格式不支持');
 if(['IHDR','IDAT','IEND'].includes(type))chunks.push(input.slice(offset,next));offset=next;
 }if(!header||!image||!end)throw Error('图片不完整');const out=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let i=0;for(const c of chunks){out.set(c,i);i+=c.length;}return out;
}
