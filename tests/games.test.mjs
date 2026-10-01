import test from 'node:test';
import assert from 'node:assert/strict';
import { initial, act, view, catalog } from '../src/games/engine.ts';

test('12 different games registered',()=>assert.equal(catalog.length,12));
test('tic tac toe win and invalid turn',()=>{let s=initial('tictactoe',42); assert.throws(()=>act(s,1,{cell:0})); for(const [p,c] of [[0,0],[1,3],[0,1],[1,4],[0,2]])s=act(s,p,{cell:c});assert.equal(s.winner,0);assert.equal(s.done,true);assert.throws(()=>act(s,1,{cell:8}));});
test('connect4 gravity and vertical win',()=>{let s=initial('connect4',3);for(let i=0;i<3;i++){s=act(s,0,{cell:0});s=act(s,1,{cell:1});}s=act(s,0,{cell:0});assert.equal(s.board[35],0);assert.equal(s.winner,0);});
test('gomoku 15x15 and five in line',()=>{let s=initial('gomoku',1);assert.equal(s.board.length,225);for(let i=0;i<4;i++){s=act(s,0,{cell:i});s=act(s,1,{cell:30+i});}s=act(s,0,{cell:4});assert.equal(s.winner,0);});
test('reversi rejects illegal moves and flips legal move',()=>{let s=initial('reversi',1);assert.throws(()=>act(s,0,{cell:0}));s=act(s,0,{cell:19});assert.equal(s.board[27],0);assert.equal(s.turn,1);});
test('rps choices stay secret and first three wins ends',()=>{let s=initial('rps',1);for(let i=0;i<3;i++){s=act(s,0,{choice:0});assert.equal(view(s,1).choices[0],null);s=act(s,1,{choice:2});}assert.equal(s.winner,0);assert.equal(s.done,true);});
test('memory hides deck and grants extra turn on match',()=>{let s=initial('memory',8);assert.equal(view(s,0).board.filter(x=>x!==null).length,0);const a=0,b=s.deck.findIndex((v,i)=>i!==0&&v===s.deck[0]);s=act(s,0,{cell:a});s=act(s,0,{cell:b});assert.equal(s.scores[0],1);assert.equal(s.turn,0);assert.equal(view(s,1).deck,undefined);});
test('bulls cows stores secrets and grants equal turns',()=>{let s=initial('bulls',2);s=act(s,0,{secret:'0123'});s=act(s,1,{secret:'4567'});assert.equal(view(s,1).secrets,undefined);s=act(s,0,{guess:'4567'});assert.equal(s.done,false);s=act(s,1,{guess:'0123'});assert.equal(s.done,true);assert.equal(s.winner,null);});
for(const id of ['quiz','predict','ranking'])test(`${id} only reveals both submissions`,()=>{let s=initial(id,11);const values=id==='ranking'?[0,1,2,3,4]:[0,0,0,0,0];s=act(s,0,{answers:values,predictions:values});assert.equal(view(s,1).answers[0],null);s=act(s,1,{answers:values,predictions:values});assert.equal(s.done,true);assert.equal(s.scores[0],5);});
test('puzzle completes collaboratively by swaps',()=>{let s=initial('puzzle',8);for(let i=0;i<9;i++){if(s.tiles[i]!==i){s=act(s,i%2,{a:i,b:s.tiles.indexOf(i)});}}assert.equal(s.done,true);assert.equal(s.winner,null);});
test('reflex validates five trials and compares median',()=>{let s=initial('reflex',5);assert.throws(()=>act(s,0,{trials:[100]}));s=act(s,0,{trials:[200,300,250,2000,240]});s=act(s,1,{trials:[300,400,500,2000,100]});assert.equal(s.done,true);assert.equal(s.winner,0);assert.equal(s.scores[0],250);});
test('invalid payloads rejected without corrupting input',()=>{let s=initial('tictactoe',1);assert.throws(()=>act(s,0,{cell:-1}));assert.throws(()=>act(s,0,{cell:1.3}));assert.equal(s.board.every(x=>x===null),true);});
