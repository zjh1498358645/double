import type {Action,GameId,Slot,State} from './engine.ts';

export type MinesState={kind:'mines';size:number;mineCount:number;lives:number;started:boolean;flags:number[];lastCell:number|null;seed?:number;mines?:number[]};
export type CircuitState={kind:'circuit';stage:number;stageComplete:boolean;size:number;pipes:number[];powered:number[];source:number;stageMoves:number;lastCell:number|null;seed?:number;solution?:number[]};
export type DotsState={kind:'dots';size:number;boxes:(Slot|null)[];lastBoxes:number[];lastCell:number|null};
export type Adventure=MinesState|CircuitState|DotsState;

export const adventureCatalog:{id:GameId;name:string;tag:string;icon:string;description:string;rule:string;color:string}[]=[
  {id:'mines',name:'双人扫雷',tag:'合作',icon:'🚩',description:'你来排查，我来标记，一起走过雷区',rule:'共同揭开6×6雷区中的29个安全格。数字表示周围8格的地雷数，切换插旗模式标记可疑格，再点一次可取消。首次揭开及周围格保证安全；共有7颗雷，两人共享3次踩雷机会。两个人随时都能操作。',color:'green'},
  {id:'circuit',name:'电路修复',tag:'合作',icon:'💡',description:'转一转线路，让每一盏小灯都亮起来',rule:'点击线路块，顺时针旋转90°。相邻接口对齐才能通电，从左上角电源出发，点亮全部格子就能过关。共同完成3×3、4×4、5×5三关，不限步数，两个人都能旋转。',color:'blue'},
  {id:'dots',name:'点格围地',tag:'对战',icon:'🔷',description:'一人连一条线，把小方格收入囊中',rule:'轮流连接相邻的两个点，围成一个小方格得1分，并继续落线。一条线可以同时围住两格。4×4共16个方格全部被占领后，得分高的一方获胜；8:8为平局。',color:'peach'},
];

function random(seed:number){let value=seed>>>0;return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};}
function shuffled<T>(values:T[],next:()=>number){const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function cellIndex(value:unknown,length:number){if(typeof value!=='number'||!Number.isInteger(value)||value<0||value>=length)throw Error('请选择棋盘上的有效位置');return value;}
function neighbours(cell:number,size:number){const row=Math.floor(cell/size),col=cell%size,result:number[]=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const r=row+dr,c=col+dc;if((dr||dc)&&r>=0&&r<size&&c>=0&&c<size)result.push(r*size+c);}return result;}
function adjacent(cell:number,direction:number,size:number){const row=Math.floor(cell/size),col=cell%size;if(direction===0)return row>0?cell-size:-1;if(direction===1)return col<size-1?cell+1:-1;if(direction===2)return row<size-1?cell+size:-1;return col>0?cell-1:-1;}
function rotate(pipe:number){return ((pipe<<1)&15)|(pipe>>3);}

function poweredCells(pipes:number[],size:number,source:number){
  const powered=new Set([source]),queue=[source];
  for(let index=0;index<queue.length;index++){
    const cell=queue[index];
    for(let direction=0;direction<4;direction++){
      const next=adjacent(cell,direction,size);
      if(next<0||powered.has(next)||!(pipes[cell]&(1<<direction))||!(pipes[next]&(1<<((direction+2)%4))))continue;
      powered.add(next);queue.push(next);
    }
  }
  return [...powered].sort((a,b)=>a-b);
}

function circuitStage(seed:number,stage:number):CircuitState{
  const size=stage+3,next=random((seed+Math.imul(stage+1,2654435761))>>>0),solution=Array<number>(size*size).fill(0),visited=new Set([0]),stack=[0];
  // Build a connected tree first: rotations always have at least this solution.
  while(stack.length){
    const cell=stack[stack.length-1],options=[0,1,2,3].filter(direction=>{const target=adjacent(cell,direction,size);return target>=0&&!visited.has(target);});
    if(!options.length){stack.pop();continue;}
    const direction=options[Math.floor(next()*options.length)],target=adjacent(cell,direction,size);
    solution[cell]|=1<<direction;solution[target]|=1<<((direction+2)%4);visited.add(target);stack.push(target);
  }
  const pipes=solution.map(pipe=>{for(let turns=Math.floor(next()*4);turns>0;turns--)pipe=rotate(pipe);return pipe;});
  let powered=poweredCells(pipes,size,0);
  if(powered.length===pipes.length){const leaf=solution.findIndex(pipe=>(pipe&(pipe-1))===0);pipes[leaf]=rotate(pipes[leaf]);powered=poweredCells(pipes,size,0);}
  return {kind:'circuit',stage,stageComplete:false,size,pipes,powered,source:0,stageMoves:0,lastCell:null,seed:seed>>>0,solution};
}

export function setupAdventure(s:State,seed:number){
  if(s.id==='mines'){s.board=Array(36).fill(null);s.adventure={kind:'mines',size:6,mineCount:7,lives:3,started:false,flags:[],lastCell:null,seed:seed>>>0,mines:[]};}
  if(s.id==='circuit')s.adventure=circuitStage(seed,0);
  if(s.id==='dots'){s.board=Array(40).fill(null);s.adventure={kind:'dots',size:4,boxes:Array(16).fill(null),lastBoxes:[],lastCell:null};}
}

function playMines(s:State,p:Slot,a:Action,e:MinesState){
  const cell=cellIndex(a.cell,s.board.length);
  if(a.mode!=='flag'&&a.mode!=='reveal')throw Error('请选择揭开或插旗模式');
  if(s.board[cell]!==null)throw Error('这一格已经揭开了');
  if(a.mode==='flag'){
    if(e.flags.includes(cell))e.flags=e.flags.filter(flag=>flag!==cell);
    else e.flags.push(cell);
    e.lastCell=cell;return;
  }
  if(e.flags.includes(cell))throw Error('先取消这一格的旗子，再揭开');
  if(!e.started){
    const safe=new Set([cell,...neighbours(cell,e.size)]);
    e.mines=shuffled(Array.from({length:s.board.length},(_,i)=>i).filter(i=>!safe.has(i)),random(e.seed!)).slice(0,e.mineCount);
    e.started=true;
  }
  e.lastCell=cell;
  const mines=new Set(e.mines);
  if(mines.has(cell)){s.board[cell]=-1;e.lives--;if(e.lives===0)s.done=true;return;}
  const queue=[cell],queued=new Set(queue);
  for(let index=0;index<queue.length;index++){
    const target=queue[index];if(s.board[target]!==null||e.flags.includes(target))continue;
    const around=neighbours(target,e.size),count=around.filter(value=>mines.has(value)).length;
    s.board[target]=count;s.scores[p]++;
    if(count===0)for(const neighbour of around)if(!queued.has(neighbour)&&!mines.has(neighbour)){queued.add(neighbour);queue.push(neighbour);}
  }
  if(s.board.filter(value=>value!==null&&value>=0).length===s.board.length-e.mineCount)s.done=true;
}

function playCircuit(s:State,p:Slot,a:Action,e:CircuitState){
  if(a.round!==e.stage)throw Error('关卡已经更新，请操作当前电路');
  if(a.advance===true){
    if(!e.stageComplete)throw Error('先点亮全部线路，再进入下一关');
    s.adventure=circuitStage(e.seed!,e.stage+1);return;
  }
  if(e.stageComplete)throw Error('这一关已经点亮，准备好后进入下一关');
  const cell=cellIndex(a.cell,e.pipes.length);
  e.pipes[cell]=rotate(e.pipes[cell]);e.lastCell=cell;e.stageMoves++;s.scores[p]++;
  e.powered=poweredCells(e.pipes,e.size,e.source);
  if(e.powered.length===e.pipes.length){e.stageComplete=true;if(e.stage===2){e.stage=3;s.done=true;}}
}

function playDots(s:State,p:Slot,a:Action,e:DotsState){
  if(s.turn!==p)throw Error('等对方连完这一条线');
  const cell=cellIndex(a.cell,s.board.length);
  if(s.board[cell]!==null)throw Error('这条线已经连好了');
  s.board[cell]=p;e.lastCell=cell;e.lastBoxes=[];
  const horizontal=e.size*(e.size+1);
  for(let box=0;box<e.boxes.length;box++){
    if(e.boxes[box]!==null)continue;
    const row=Math.floor(box/e.size),col=box%e.size,edges=[row*e.size+col,(row+1)*e.size+col,horizontal+row*(e.size+1)+col,horizontal+row*(e.size+1)+col+1];
    if(edges.every(edge=>s.board[edge]!==null)){e.boxes[box]=p;e.lastBoxes.push(box);s.scores[p]++;}
  }
  if(!e.lastBoxes.length)s.turn=(1-p) as Slot;
  if(e.boxes.every(owner=>owner!==null)){s.done=true;s.winner=s.scores[0]===s.scores[1]?null:s.scores[0]>s.scores[1]?0:1;}
}

export function playAdventure(s:State,p:Slot,a:Action){
  const e=s.adventure;
  if(e?.kind==='mines')playMines(s,p,a,e);
  if(e?.kind==='circuit')playCircuit(s,p,a,e);
  if(e?.kind==='dots')playDots(s,p,a,e);
}

export function showAdventure(s:Partial<State>){
  const e=s.adventure;
  if(e?.kind==='mines'){delete e.seed;delete e.mines;}
  if(e?.kind==='circuit'){delete e.seed;delete e.solution;}
}
