import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,act as play,view,catalog} from '../src/games/engine.ts';
test('bomb has five collaborative modules with private split instructions',()=>{
 let s=initial('bomb',42);assert.ok(catalog.some(g=>g.id==='bomb'));
 for(let stage=0;stage<5;stage++){
  const a=view(s,0),b=view(s,1);assert.equal(a.extra.bombCodes,undefined);assert.equal(b.extra.bombCodes,undefined);
  assert.equal(a.extra.bombHint.length,4);assert.notEqual(a.extra.bombHint,b.extra.bombHint);
  assert.throws(()=>play(s,0,{guess:'0000',round:stage+1}));
  const code=a.extra.bombHint.split('').map((c,i)=>c==='·'?b.extra.bombHint[i]:c).map(c=>String((Number(c)-stage-1+10)%10)).join('');
  s=play(s,stage%2,{guess:code,round:stage});assert.equal(s.extra.stage,stage+1);
 }
 assert.equal(s.done,true);assert.deepEqual(s.scores,[5,5]);
});
test('bomb mistakes exhaust shared safety chances, stale and invalid submissions do not',()=>{
 let s=initial('bomb',19);const code=s.extra.bombCodes[0],wrong=code==='0000'?'1111':'0000';
 assert.throws(()=>play(s,0,{guess:'x',round:0}));
 for(let i=0;i<3;i++)s=play(s,i%2,{guess:wrong,round:0});
 assert.equal(s.done,true);assert.equal(s.extra.attempts,3);assert.equal(s.extra.stage,0);
});
