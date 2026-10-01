import pngBrowser from 'pngjs/browser.js';
const {PNG}=pngBrowser;
export function normalizePNG(input:Uint8Array,maxSide=1600):Buffer{
 const data=Buffer.from(input);if(data.length>10*1024*1024||data.length<24||data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('请选择有效的图片，最大10MB');
 const w=data.readUInt32BE(16),h=data.readUInt32BE(20);if(!w||!h||w*h>4000000)throw Error('图片像素过大，请先压缩');
 const decoded=PNG.sync.read(data,{checkCRC:true});const scale=Math.min(1,maxSide/Math.max(w,h)),width=Math.max(1,Math.round(w*scale)),height=Math.max(1,Math.round(h*scale));const output=new PNG({width,height});
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const src=(Math.min(h-1,Math.floor(y/scale))*w+Math.min(w-1,Math.floor(x/scale)))*4;decoded.data.copy(output.data,(y*width+x)*4,src,src+4);}
 return Buffer.from(PNG.sync.write(output,{colorType:6,deflateLevel:6}));
}
