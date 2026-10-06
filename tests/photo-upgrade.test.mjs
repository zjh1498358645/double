import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {freeJPEG} from '../src/server/free-jpeg.ts';
test('new photo retains 3200px detail without changing portrait proportions',async()=>{
 const input=await sharp({create:{width:2400,height:3200,channels:3,background:'#adbcde'}}).jpeg({quality:94}).withMetadata().toBuffer();
 const output=freeJPEG(input,{maxSide:3200,maxBytes:1900*1024});
 const info=await sharp(output).metadata();assert.equal(info.width,2400);assert.equal(info.height,3200);assert.equal(info.exif,undefined);
});
test('preview validator rejects full-size images and excess preview bytes',async()=>{
 const input=await sharp({create:{width:500,height:300,channels:3,background:'white'}}).jpeg().toBuffer();
 assert.throws(()=>freeJPEG(input,{maxSide:480,maxBytes:100*1024}));
});
