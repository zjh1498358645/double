import test from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';
import {originalPhoto} from '../src/server/original-photo.ts';
test('original JPEG, PNG and WebP keep every byte and full dimensions',async()=>{
 for(const [format,mime] of [['jpeg','image/jpeg'],['png','image/png'],['webp','image/webp']]){
  const input=await sharp({create:{width:4032,height:3024,channels:3,background:'#7e916e'}})[format]().withMetadata().toBuffer();
  const result=originalPhoto(input,mime);assert.deepEqual(result.bytes,input);assert.equal(result.width,4032);assert.equal(result.height,3024);assert.equal(result.mime,mime);
 }
});
test('original validation refuses mismatched MIME, broken framing, excess size and unreasonable pixel count',async()=>{
 const good=await sharp({create:{width:10,height:10,channels:3,background:'red'}}).png().toBuffer();
 assert.throws(()=>originalPhoto(good,'image/jpeg'));assert.throws(()=>originalPhoto(good.subarray(0,good.length-2),'image/png'));
 assert.throws(()=>originalPhoto(Buffer.alloc(10*1024*1024+1),'image/jpeg'));assert.throws(()=>originalPhoto(Buffer.from('<svg/>'),'image/svg+xml'));
 const big=await sharp({create:{width:10000,height:10000,channels:3,background:'white'}}).png().toBuffer();assert.throws(()=>originalPhoto(big,'image/png'));
});
