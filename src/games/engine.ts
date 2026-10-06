export type Slot = 0 | 1;
import {extendedCatalog,setupExtra,playExtra,showExtra,type Extra} from './extended.ts';
export type GameId = 'tictactoe'|'connect4'|'gomoku'|'reversi'|'rps'|'memory'|'reflex'|'bulls'|'quiz'|'predict'|'ranking'|'puzzle'|'fleet'|'cards'|'maze'|'escape'|'liar'|'draw'|'chemistry'|'match'|'bomb';
export type Action = {cell?:number;choice?:number;secret?:string;guess?:string;answers?:number[];predictions?:number[];trials?:number[];a?:number;b?:number;statements?:string[];pixels?:number[];stroke?:import('./drawing.ts').Stroke;drawing?:'undo'|'clear';round?:number;drawingRevision?:number};
export type State = {id:GameId;turn:Slot;done:boolean;winner:Slot|null;board:(number|null)[];scores:number[];choices:(number|null)[];rounds:number[][];deck:number[];matched:number[];flipped:number[];lastFlip:number[];secrets:(string|null)[];guesses:{slot:Slot;guess:string;exact:number;near:number}[];solved:boolean[];answers:(number[]|null)[];predictions:(number[]|null)[];questions:Question[];tiles:number[];trials:(number[]|null)[];moves:number;extra?:Extra};
export type Question={title:string;options:string[]};
export const catalog:{id:GameId;name:string;tag:string;icon:string;description:string;rule:string;color:string}[]=[
 ...extendedCatalog,
 {id:'quiz',name:'默契问答',tag:'默契',icon:'💌',description:'你的答案，会和我一样吗？',rule:'各自回答5道题，两人提交后揭晓。每题选择相同，默契值加1。',color:'pink'},
 {id:'tictactoe',name:'井字棋',tag:'对战',icon:'✕',description:'三步连线，小小的较量',rule:'轮流在3×3棋盘落子，横、竖或斜向三子连线获胜。',color:'green'},
 {id:'memory',name:'记忆翻牌',tag:'对战',icon:'🍓',description:'一起找回藏起来的小可爱',rule:'16张牌组成8对，轮流翻两张。配对成功得1分并继续，失败则轮到对方。',color:'peach'},
 {id:'puzzle',name:'双人拼图',tag:'合作',icon:'🧩',description:'一人一块，拼出我们的风景',rule:'点选两块交换位置，两人共同还原3×3插画。块上的小编号是原位置提示。',color:'blue'},
 {id:'connect4',name:'四子棋',tag:'对战',icon:'🔴',description:'让四颗小星星排在一起',rule:'选择一列放入棋子，棋子落至底部。横、竖、斜向四连获胜。',color:'peach'},
 {id:'gomoku',name:'五子棋',tag:'对战',icon:'⚫',description:'慢慢想，陪你下一盘',rule:'15×15棋盘，无禁手。五子或更多连成一线获胜。先点格子，再确认落子。',color:'green'},
 {id:'reversi',name:'黑白棋',tag:'对战',icon:'◐',description:'翻转局势，也翻转你的心',rule:'落子必须夹住对方棋子。无合法步自动跳过，结束时棋子多的一方胜。',color:'blue'},
 {id:'rps',name:'石头剪刀布',tag:'对战',icon:'✊',description:'三二一，我们一起出！',rule:'双方秘密出拳后揭晓。先赢3回合获胜，平局不计胜场。',color:'pink'},
 {id:'bulls',name:'猜数字',tag:'对战',icon:'🔢',description:'从一点点线索猜到你',rule:'各设置4位不重复数字，可用0开头。A为位置正确，B为数字正确位置错误。双方获得同等猜测回合。',color:'blue'},
 {id:'reflex',name:'反应速度赛',tag:'对战',icon:'⚡',description:'看看谁先接住这一秒',rule:'等按钮变绿再点，共5次，比较中位反应时间。抢点记2000ms，切后台取消当前试次。休闲计时，不用于专业测量。',color:'peach'},
 {id:'predict',name:'猜猜你的选择',tag:'默契',icon:'🔮',description:'比起输赢，更想懂你',rule:'先选自己的答案，再猜对方的选择，共5题。两人提交后揭晓预测得分。',color:'pink'},
 {id:'ranking',name:'心动排序',tag:'默契',icon:'💗',description:'把心动的事情排个顺序',rule:'各自排序5种约会活动，提交后对照，相同位置加1分。没有标准答案。',color:'green'},
];
const quizTitles=['周末最想一起去哪','今晚想吃什么','下雨天最想做什么','旅行先考虑什么','想收到哪种小惊喜','理想约会是什么','更喜欢哪种电影','累了想怎样放松','想学哪种新技能','想养什么小动物','想在哪看日落','想尝试哪种运动','旅行想住哪里','一起做饭先做什么','睡前想聊什么','最想过哪种节日','想收集什么回忆','今天想喝什么','想一起看什么风景','最舒服的陪伴是什么','想给小屋添什么','更想听哪种音乐','想一起参加什么活动','早起后想做什么','想在纪念日做什么','突然有一天假期想干嘛','想尝试哪种手作','最想一起拍什么照片','想去哪里散步','想共同完成什么'];
const quizOptions=[['海边','山里','老街','家里'],['火锅','面条','烧烤','自己做'],['看电影','听雨','做饭','打游戏'],['风景','美食','交通','住宿'],['一封信','一束花','小礼物','陪伴'],['散步','野餐','看展','做饭'],['喜剧','动画','悬疑','爱情'],['睡一觉','散步','聊天','听歌'],['画画','烘焙','摄影','乐器'],['猫','狗','兔子','小鸟'],['海边','屋顶','山上','公园'],['骑车','游泳','羽毛球','徒步'],['民宿','酒店','露营','小木屋'],['早餐','甜点','主菜','汤'],['今天的小事','未来计划','有趣问题','温柔晚安'],['生日','纪念日','春节','普通周末'],['照片','车票','明信片','日记'],['奶茶','咖啡','果汁','白水'],['花海','星空','雪景','海浪'],['安静待着','一起做事','说说笑笑','拥抱'],['植物','灯','地毯','相框'],['流行','轻音乐','摇滚','民谣'],['市集','音乐会','展览','运动'],['吃早餐','散步','继续睡','晒太阳'],['写信','旅行','做饭','拍照'],['短途旅行','宅家','探店','见朋友'],['陶艺','编织','木工','烘焙'],['合照','背影','搞怪照','生活照'],['河边','公园','老街','校园'],['读一本书','学一道菜','走一条路线','做一个作品']];
export const questions:Question[]=quizTitles.map((title,i)=>({title,options:quizOptions[i]}));
const pairs=[['山间','海边'],['早起','晚睡'],['咖啡','奶茶'],['猫咪','狗狗'],['电影','散步'],['甜食','咸食'],['计划旅行','随性旅行'],['夏天','冬天'],['晴天','雨天'],['做饭','外卖'],['书店','游乐园'],['合照','抓拍'],['花束','手写信'],['城市','乡村'],['火锅','烧烤'],['电话','文字'],['日出','日落'],['野餐','露营'],['动画','真人电影'],['热饮','冰饮'],['博物馆','音乐会'],['运动','手作'],['早餐','夜宵'],['礼物','陪伴'],['山路','海岸'],['热闹','安静'],['听歌','聊天'],['摄影','画画'],['明信片','纪念品'],['一起冒险','一起休息']];
export const pairQuestions:Question[]=pairs.map(p=>({title:`你更喜欢${p[0]}还是${p[1]}？`,options:p}));
const activities=['一起看日落','一起做晚餐','一起去看展','一起打游戏','一起散步','一起露营','一起逛书店','一起看电影','一起学画画','一起骑车','一起做甜点','一起听音乐会','一起逛市集','一起拍照片','一起去海边'];
export const rankingSets:Question[]=Array.from({length:10},(_,i)=>({title:'把你最心动的约会排在前面',options:Array.from({length:5},(_,j)=>activities[(i*2+j)%activities.length])}));
function rng(seed:number){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function shuffled<T>(list:T[],random:()=>number):T[]{const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function initial(id:GameId,seed:number):State{
 if(!catalog.some(g=>g.id===id))throw Error('没有这个游戏');const random=rng(seed);
 const s:State={id,turn:0,done:false,winner:null,board:[],scores:[0,0],choices:[null,null],rounds:[],deck:[],matched:[],flipped:[],lastFlip:[],secrets:[null,null],guesses:[],solved:[false,false],answers:[null,null],predictions:[null,null],questions:[],tiles:[],trials:[null,null],moves:0};
 if(['tictactoe','connect4','gomoku','reversi'].includes(id))s.board=Array(id==='tictactoe'?9:id==='connect4'?42:id==='gomoku'?225:64).fill(null);
 if(id==='reversi'){s.board[27]=1;s.board[36]=1;s.board[28]=0;s.board[35]=0;}
 if(id==='memory')s.deck=shuffled(Array.from({length:16},(_,i)=>i%8),random);
 if(id==='puzzle'){s.tiles=shuffled(Array.from({length:9},(_,i)=>i),random);if(s.tiles.every((v,i)=>v===i))[s.tiles[0],s.tiles[1]]=[s.tiles[1],s.tiles[0]];}
 if(id==='quiz')s.questions=shuffled(questions,random).slice(0,5);
 if(id==='predict')s.questions=shuffled(pairQuestions,random).slice(0,5);
 if(id==='ranking')s.questions=[rankingSets[Math.floor(random()*10)]];
 setupExtra(s,seed);return s;
}
function integer(v:unknown,min:number,max:number):number{if(typeof v!=='number'||!Number.isInteger(v)||v<min||v>max)throw Error('请选择有效的位置');return v;}
function finishScores(s:State){s.done=true;s.winner=s.scores[0]===s.scores[1]?null:s.scores[0]>s.scores[1]?0:1;}
function connected(board:(number|null)[],cell:number,width:number,target:number){const r=Math.floor(cell/width),c=cell%width,p=board[cell];return [[0,1],[1,0],[1,1],[1,-1]].some(([dr,dc])=>{let count=1;for(const dir of [-1,1])for(let k=1;k<target;k++){const nr=r+dr*k*dir,nc=c+dc*k*dir;if(nr<0||nr>=board.length/width||nc<0||nc>=width||board[nr*width+nc]!==p)break;count++;}return count>=target;});}
export function reversiFlips(board:(number|null)[],cell:number,p:Slot):number[]{if(board[cell]!==null)return [];const r=Math.floor(cell/8),c=cell%8,out:number[]=[];for(const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){const line:number[]=[];for(let k=1;k<8;k++){const nr=r+k*dr,nc=c+k*dc;if(nr<0||nr>7||nc<0||nc>7)break;const i=nr*8+nc;if(board[i]===1-p)line.push(i);else{if(board[i]===p&&line.length)out.push(...line);break;}}}return out;}
export function act(state:State,p:Slot,a:Action):State{
 if(state.done)throw Error('这局已经结束了');if(p!==0&&p!==1)throw Error('不是小屋成员');if(!a||typeof a!=='object')throw Error('操作无效');const s=structuredClone(state);const other=(1-p) as Slot;
 if(['tictactoe','connect4','gomoku','reversi','memory'].includes(s.id)&&s.turn!==p)throw Error('等对方走完这一回合');
 if(['tictactoe','connect4','gomoku','reversi'].includes(s.id)){
  let cell=integer(a.cell,0,s.id==='connect4'?6:s.board.length-1);if(s.id==='connect4'){let found=-1;for(let r=5;r>=0;r--)if(s.board[r*7+cell]===null){found=r*7+cell;break;}if(found<0)throw Error('这一列已经满了');cell=found;}
  if(s.board[cell]!==null)throw Error('这里已经有棋子了');
  if(s.id==='reversi'){const flips=reversiFlips(s.board,cell,p);if(!flips.length)throw Error('这里不能翻转对方棋子');for(const i of flips)s.board[i]=p;}
  s.board[cell]=p;s.turn=other;
  if(s.id==='reversi'){const legal=(slot:Slot)=>s.board.some((_,i)=>reversiFlips(s.board,i,slot).length);if(!legal(other)){s.turn=p;if(!legal(p)){s.scores=[s.board.filter(v=>v===0).length,s.board.filter(v=>v===1).length];finishScores(s);}}}
  else if(connected(s.board,cell,s.id==='tictactoe'?3:s.id==='connect4'?7:15,s.id==='tictactoe'?3:s.id==='connect4'?4:5)){s.done=true;s.winner=p;}
  else if(s.board.every(v=>v!==null))s.done=true;
 }else if(s.id==='rps'){
  if(s.choices[p]!==null)throw Error('已出拳，等待对方');s.choices[p]=integer(a.choice,0,2);
  if(s.choices.every(v=>v!==null)){const [x,y]=s.choices as number[];s.rounds.push([x,y]);if(x!==y)s.scores[(x-y+3)%3===1?0:1]++;s.choices=[null,null];if(s.scores.some(v=>v===3))finishScores(s);}
 }else if(s.id==='memory'){
  const cell=integer(a.cell,0,15);if(s.matched.includes(cell)||s.flipped.includes(cell))throw Error('换一张没翻开的牌');s.lastFlip=[];s.flipped.push(cell);
  if(s.flipped.length===2){const [x,y]=s.flipped;if(s.deck[x]===s.deck[y]){s.matched.push(x,y);s.scores[p]++;}else{s.lastFlip=[x,y];s.turn=other;}s.flipped=[];if(s.matched.length===16)finishScores(s);}
 }else if(s.id==='bulls'){
  const valid=(v:unknown)=>typeof v==='string'&&/^\d{4}$/.test(v)&&new Set(v).size===4;
  if(a.secret!==undefined){if(s.secrets[p]!==null||!valid(a.secret))throw Error('请输入4位不重复数字');s.secrets[p]=a.secret;}
  else{if(!s.secrets.every(Boolean))throw Error('等待双方设置数字');if(s.turn!==p)throw Error('等待对方猜数字');if(!valid(a.guess))throw Error('请输入4位不重复数字');const guess=a.guess!,secret=s.secrets[other]!;const exact=[...guess].filter((c,i)=>c===secret[i]).length,near=[...guess].filter(c=>secret.includes(c)).length-exact;s.guesses.push({slot:p,guess,exact,near});if(exact===4)s.solved[p]=true;s.turn=other;const turns=s.guesses.filter(g=>g.slot===0).length===s.guesses.filter(g=>g.slot===1).length;if(turns&&s.solved.some(Boolean)){s.done=true;s.winner=s.solved[0]&&s.solved[1]?null:s.solved[0]?0:1;}}
 }else if(['quiz','predict','ranking'].includes(s.id)){
  if(s.answers[p]!==null)throw Error('已提交，等待对方');if(!Array.isArray(a.answers)||a.answers.length!==5)throw Error('请完成所有选择');
  if(s.id==='ranking'){a.answers.forEach(v=>integer(v,0,4));if(new Set(a.answers).size!==5)throw Error('排序不能重复');}
  else a.answers.forEach((v,i)=>integer(v,0,s.questions[i].options.length-1));
  if(s.id==='predict'){if(!Array.isArray(a.predictions)||a.predictions.length!==5)throw Error('请猜猜对方的选择');a.predictions.forEach(v=>integer(v,0,1));s.predictions[p]=a.predictions;}
  s.answers[p]=a.answers;
  if(s.answers.every(v=>v!==null)){if(s.id==='predict')s.scores=[0,1].map(slot=>s.predictions[slot]!.filter((v,i)=>v===s.answers[1-slot]![i]).length);else{const score=s.answers[0]!.filter((v,i)=>v===s.answers[1]![i]).length;s.scores=[score,score];}s.done=true;s.winner=null;}
 }else if(s.id==='puzzle'){
  const x=integer(a.a,0,8),y=integer(a.b,0,8);if(x===y)throw Error('选择两块不同的拼图');[s.tiles[x],s.tiles[y]]=[s.tiles[y],s.tiles[x]];if(s.tiles.every((v,i)=>v===i))s.done=true;
 }else if(s.id==='reflex'){
  if(s.trials[p]!==null)throw Error('已经完成计时');if(!Array.isArray(a.trials)||a.trials.length!==5)throw Error('请完成5次计时');a.trials.forEach(v=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>10000)throw Error('计时数据无效');});s.trials[p]=a.trials;s.scores[p]=[...a.trials].sort((x,y)=>x-y)[2];if(s.trials.every(v=>v!==null)){s.done=true;s.winner=s.scores[0]===s.scores[1]?null:s.scores[0]<s.scores[1]?0:1;}
 }
 if(s.extra)playExtra(s,p,a);s.moves++;return s;
}
export function view(state:State,p:Slot){const s:Partial<State>=structuredClone(state);delete s.secrets;delete s.deck;
 if(state.id==='memory')s.board=state.deck.map((v,i)=>state.matched.includes(i)||state.flipped.includes(i)||state.lastFlip.includes(i)?v:null);
 if(!state.done){if(state.id==='rps'){s.choices=[null,null];s.choices[p]=state.choices[p];}if(['quiz','predict','ranking'].includes(state.id)){s.answers=[null,null];s.answers[p]=state.answers[p];s.predictions=[null,null];s.predictions[p]=state.predictions[p];}if(state.id==='reflex'){s.trials=[null,null];s.trials[p]=state.trials[p];s.scores=[0,0];s.scores[p]=state.scores[p];}}
 showExtra(state,s,p);return {...s,ready:state.id==='bulls'?state.secrets.map(Boolean):state.id==='reflex'?state.trials.map(v=>v!==null):state.answers.map(v=>v!==null)};
}

