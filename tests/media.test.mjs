import test from 'node:test';import assert from 'node:assert/strict';import {PNG} from 'pngjs';import {normalizePNG} from '../src/server/media.ts';
test('fake images and oversized payload rejected',()=>{assert.throws(()=>normalizePNG(Buffer.from('not an image')));assert.throws(()=>normalizePNG(Buffer.alloc(10*1024*1024+1)));});
test('valid PNG rewritten without metadata and bounded width',()=>{const p=new PNG({width:1800,height:1});p.data.fill(255);const clean=normalizePNG(PNG.sync.write(p));const decoded=PNG.sync.read(clean);assert.equal(decoded.width,1600);assert.equal(decoded.height,1);});
