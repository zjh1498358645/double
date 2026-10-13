import test from 'node:test';import assert from 'node:assert/strict';import {preparePhotoUpload} from '../src/prepare-photo-upload.ts';
test('browser upload encodes only preview and keeps large original byte-for-byte',async()=>{
 const previousDocument=globalThis.document,previousBitmap=globalThis.createImageBitmap,canvases=[];let closed=false;
 globalThis.createImageBitmap=async()=>({width:4032,height:3024,close(){closed=true;}});
 globalThis.document={createElement(){const canvas={width:0,height:0,getContext:()=>({fillRect(){},drawImage(){}}),toBlob(fn,mime){fn(new Blob(['preview'],{type:mime}));}};canvases.push(canvas);return canvas;}};
 try{const data=new Uint8Array(3_000_000).fill(83),file=new File([data],'original.jpg',{type:'image/jpeg'}),form=await preparePhotoUpload(file,true);assert.equal(form.get('original'),'1');assert.deepEqual(new Uint8Array(await form.get('photo').arrayBuffer()),data);assert.equal(canvases.length,1);assert.equal(canvases[0].width,960);assert.equal(canvases[0].height,720);assert.equal(form.get('preview').type,'image/jpeg');assert.equal(closed,true);}finally{globalThis.document=previousDocument;globalThis.createImageBitmap=previousBitmap;}
});
