import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,act,view,catalog} from '../src/games/engine.ts';
import {cooperativeResult,isCooperative} from '../src/games/results.ts';
import {deriveEffects} from '../src/games/presentation.ts';

test('new cooperative and competitive games can be started from the catalogue',()=>{
  for(const [id,tag] of [['mines','合作'],['circuit','合作'],['dots','对战']]){
    assert.equal(catalog.find(game=>game.id===id)?.tag,tag);
    assert.equal(initial(id,42).done,false);
  }
});

test('mines first reveal and all its neighbours are safe for either member',()=>{
  for(let seed=0;seed<12;seed++)for(const cell of [0,14,35]){
    const start=initial('mines',seed),s=act(start,1,{cell,mode:'reveal'});
    assert.equal(start.adventure.started,false);
    assert.equal(s.board[cell],0);
    assert.equal(s.adventure.lives,3);
    assert.equal(new Set(s.adventure.mines).size,7);
    for(const mine of s.adventure.mines)assert.ok(Math.abs(Math.floor(mine/6)-Math.floor(cell/6))>1||Math.abs(mine%6-cell%6)>1);
    assert.deepEqual(s,act(initial('mines',seed),1,{cell,mode:'reveal'}));
  }
});

test('mine positions and seed stay private in both snapshots including after a hit',()=>{
  let s=act(initial('mines',91872),0,{cell:0,mode:'reveal'});
  const mine=s.adventure.mines[0];
  for(const p of [0,1]){
    const publicState=view(s,p);
    assert.equal(publicState.adventure.mines,undefined);
    assert.equal(publicState.adventure.seed,undefined);
    assert.equal(publicState.board[mine],null);
  }
  s=act(s,1,{cell:mine,mode:'reveal'});
  assert.equal(view(s,0).board[mine],-1);
  for(const remaining of s.adventure.mines.slice(1))assert.equal(view(s,1).board[remaining],null);
  assert.equal(view(s,0).adventure.mines,undefined);
});

test('shared flags block revealing and invalid mine actions cannot mutate a game',()=>{
  let s=initial('mines',8);
  s=act(s,1,{cell:14,mode:'flag'});
  assert.deepEqual(view(s,0).adventure.flags,[14]);
  assert.equal(s.adventure.started,false);
  assert.throws(()=>act(s,0,{cell:14,mode:'reveal'}));
  s=act(s,0,{cell:14,mode:'flag'});
  assert.deepEqual(s.adventure.flags,[]);
  for(const action of [{cell:-1,mode:'reveal'},{cell:36,mode:'flag'},{cell:1.5,mode:'reveal'},{cell:0,mode:'cheat'},{cell:0},{}]){
    const copy=structuredClone(s);assert.throws(()=>act(s,0,action));assert.deepEqual(s,copy);
  }
  s=act(s,0,{cell:14,mode:'reveal'});
  assert.throws(()=>act(s,1,{cell:14,mode:'flag'}));
  assert.throws(()=>act(s,1,{cell:14,mode:'reveal'}));
  assert.throws(()=>act(s,2,{cell:30,mode:'reveal'}));
});

test('three mine hits end the shared attempt and no finished input is accepted',()=>{
  let s=act(initial('mines',11),0,{cell:14,mode:'reveal'});
  for(const [i,cell] of s.adventure.mines.slice(0,3).entries()){
    s=act(s,i%2,{cell,mode:'reveal'});assert.equal(s.adventure.lives,2-i);assert.equal(s.done,i===2);
  }
  assert.equal(s.winner,null);assert.equal(isCooperative('mines'),true);
  assert.match(cooperativeResult(s),/机会用完/);
  assert.throws(()=>act(s,0,{cell:35,mode:'flag'}));
});

test('revealing every safe cell completes mines together with accurate adjacent counts',()=>{
  let s=act(initial('mines',73),1,{cell:0,mode:'reveal'});
  const mines=[...s.adventure.mines];
  for(let cell=0;cell<36&&!s.done;cell++)if(!mines.includes(cell)&&s.board[cell]===null)s=act(s,cell%2,{cell,mode:'reveal'});
  assert.equal(s.done,true);assert.equal(s.winner,null);
  assert.equal(s.scores[0]+s.scores[1],29);
  for(let cell=0;cell<36;cell++){
    if(mines.includes(cell)){assert.equal(s.board[cell],null);continue;}
    const neighbours=mines.filter(m=>Math.abs(Math.floor(m/6)-Math.floor(cell/6))<=1&&Math.abs(m%6-cell%6)<=1);
    assert.equal(s.board[cell],neighbours.length);
  }
  assert.match(cooperativeResult(s),/排雷成功/);
  assert.throws(()=>act(s,1,{cell:mines[0],mode:'reveal'}));
});

function solveCircuitStage(state){
  let s=state;const stage=s.adventure.stage,solution=[...s.adventure.solution];
  for(let cell=0;cell<solution.length&&!s.done&&!s.adventure.stageComplete;cell++){
    let turns=0;while(s.adventure.pipes[cell]!==solution[cell]){
      assert.ok(turns++<4,'every generated tile must rotate into the solution');
      s=act(s,(cell+turns)%2,{cell,round:stage});
    }
  }
  return s;
}

test('circuit stages are deterministic, initially unsolved and solvable entirely by rotations',()=>{
  for(let seed=0;seed<20;seed++){
    let s=initial('circuit',seed);assert.deepEqual(s,initial('circuit',seed));
    for(let stage=0;stage<3;stage++){
      assert.equal(s.adventure.stage,stage);assert.equal(s.adventure.size,stage+3);
      assert.ok(s.adventure.powered.length<s.adventure.size**2);
      assert.equal(view(s,0).adventure.solution,undefined);
      assert.equal(view(s,1).adventure.seed,undefined);
      s=solveCircuitStage(s);
      assert.equal(s.adventure.powered.length,s.adventure.size**2);
      if(stage<2){
        assert.equal(s.adventure.stageComplete,true);assert.equal(s.done,false);
        assert.throws(()=>act(s,0,{cell:0,round:stage}));
        s=act(s,1,{advance:true,round:stage});
      }
    }
    assert.equal(s.done,true);assert.equal(s.adventure.stage,3);assert.equal(s.winner,null);
    assert.match(cooperativeResult(s),/全部电路/);
    assert.throws(()=>act(s,0,{advance:true,round:3}));
  }
  assert.notDeepEqual(initial('circuit',11).adventure.pipes,initial('circuit',12).adventure.pipes);
});

test('circuit validates current stage and only powers mutually joined connectors',()=>{
  let s=initial('circuit',3);
  for(const action of [{cell:0},{cell:0,round:1},{cell:-1,round:0},{cell:9,round:0},{cell:0.5,round:0},{advance:true,round:0}])assert.throws(()=>act(s,0,action));
  s.adventure.pipes=[2,8,4,2,8,1,2,8,1];
  s.adventure.powered=[0,1];
  s=act(s,1,{cell:1,round:0});
  assert.deepEqual(s.adventure.powered,[0]);
  assert.equal(s.adventure.pipes[1],1);
  assert.equal(s.scores[1],1);
  s=solveCircuitStage(initial('circuit',3));s=act(s,0,{advance:true,round:0});
  assert.throws(()=>act(s,1,{cell:0,round:0}));
});

test('dots requires the current player and rejects duplicate or malformed edges',()=>{
  let s=initial('dots',1);assert.equal(s.board.length,40);assert.equal(s.adventure.boxes.length,16);
  assert.throws(()=>act(s,1,{cell:0}));
  for(const cell of [-1,40,1.2,null,undefined])assert.throws(()=>act(s,0,{cell}));
  s=act(s,0,{cell:0});assert.equal(s.turn,1);assert.equal(s.board[0],0);
  assert.throws(()=>act(s,1,{cell:0}));assert.deepEqual(s.scores,[0,0]);
});

test('closing a dots box scores it and grants the same player another move',()=>{
  let s=initial('dots',1);
  for(const cell of [0,4,20,21])s=act(s,s.turn,{cell});
  assert.equal(s.adventure.boxes[0],1);assert.deepEqual(s.scores,[0,1]);assert.equal(s.turn,1);
  assert.deepEqual(s.adventure.lastBoxes,[0]);
  s=act(s,1,{cell:1});assert.equal(s.turn,0);
});

test('one dots edge can close two boxes and award both only once',()=>{
  let s=initial('dots',1);
  for(const cell of [0,1,4,5,20,22,21])s=act(s,s.turn,{cell});
  assert.deepEqual(s.adventure.boxes.slice(0,2),[0,0]);assert.deepEqual(s.scores,[2,0]);assert.equal(s.turn,0);
  assert.deepEqual(s.adventure.lastBoxes,[0,1]);assert.throws(()=>act(s,0,{cell:21}));
});

test('a full dots game records its winner and rejects further moves',()=>{
  let s=initial('dots',1);
  for(const cell of [...Array.from({length:20},(_,i)=>20+i),...Array.from({length:20},(_,i)=>i)])s=act(s,s.turn,{cell});
  assert.equal(s.done,true);assert.equal(s.winner,0);assert.deepEqual(s.scores,[16,0]);
  assert.ok(s.adventure.boxes.every(owner=>owner===0));
  assert.throws(()=>act(s,1,{cell:0}));assert.equal(isCooperative('dots'),false);
});

test('equal dots territory ends in an eight to eight draw',()=>{
  let s=initial('dots',1);
  const edges=[28,34,8,10,31,24,25,39,22,14,2,23,5,6,37,7,19,16,0,30,33,11,21,1,13,36,18,38,3,15,20,32,26,4,29,35,9,12,17,27];
  for(const cell of edges)s=act(s,s.turn,{cell});
  assert.equal(s.done,true);assert.deepEqual(s.scores,[8,8]);assert.equal(s.winner,null);
});

test('new game effects reflect only revealed mines, rotated cells and claimed edges',()=>{
  const mines=initial('mines',7),revealed=act(mines,0,{cell:0,mode:'reveal'});
  const effects=deriveEffects(view(mines,0),view(revealed,0));
  assert.ok(effects.length>0);assert.ok(effects.every(effect=>revealed.board[effect.position]!==null&&effect.type==='reveal'));
  const circuit=initial('circuit',7),rotated=act(circuit,1,{cell:0,round:0});
  assert.deepEqual(deriveEffects(circuit,rotated).map(({position,type})=>({position,type})),[{position:0,type:'rotate'}]);
  const dots=initial('dots',7),lined=act(dots,0,{cell:0});
  assert.equal(deriveEffects(dots,lined)[0].type,'place');
  assert.deepEqual(deriveEffects(lined,structuredClone(lined)),[]);
});
