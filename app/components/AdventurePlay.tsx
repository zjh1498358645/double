'use client';
import {useState} from 'react';import {Flag,MousePointer2,Zap,Heart,ChevronRight} from 'lucide-react';
import type {Action,Slot} from '@/src/games/engine';import type {VisibleState} from './GamePlay';import {useGameEffects} from './useGameEffects';
import './adventure-games.css';
type Props={state:VisibleState;slot:Slot;names:string[];busy:boolean;onAction:(a:Action)=>Promise<boolean>};
export default function AdventurePlay({state:s,slot,names,busy,onAction}:Props){
 const [mode,setMode]=useState<'reveal'|'flag'>('reveal'),effects=useGameEffects(s),e=s.adventure;
 if(!e)return null;
 const send=(a:Action)=>void onAction(a);
 if(e.kind==='mines'){
  const revealed=(s.board||[]).filter(n=>n!==null&&n>=0).length,target=e.size**2-e.mineCount;
  return <section className="adventure-play mines-play" aria-label="双人扫雷棋盘"><div className="adventure-stats"><div><span>共同进度</span><b>{revealed}<small> / {target}</small></b></div><div><span>安全机会</span><b className="mine-lives" aria-label={`还剩${e.lives}次机会`}>{[0,1,2].map(i=><Heart key={i} size={20} fill={i<e.lives?'currentColor':'none'} className={i<e.lives?'':'spent'}/>)}</b></div><div><span>标记 / 地雷</span><b>{e.flags.length}<small> / {e.mineCount}</small></b></div></div>
   <div className="adventure-progress"><i style={{width:`${revealed/target*100}%`}}/></div><p className="adventure-turn" aria-live="polite">{s.done?(e.lives?'安全格全找到啦，配合成功！':'机会用完了，一起重新挑战吧'):!e.started?'从任意一格开始，第一次揭开保证安全':'两人都可以操作，先聊一聊可疑的位置。'}</p>
   <div className="mine-controls"><button className={mode==='reveal'?'selected':''} aria-pressed={mode==='reveal'} onClick={()=>setMode('reveal')}><MousePointer2 size={17}/> 揭开格子</button><button className={mode==='flag'?'selected':''} aria-pressed={mode==='flag'} onClick={()=>setMode('flag')}><Flag size={17}/> 插旗 / 取消</button></div>
   <div className="mines-board" style={{gridTemplateColumns:`repeat(${e.size},1fr)`}}>{s.board?.map((value,i)=><button key={i} className={`mine-cell ${value===null?'covered':'opened'} ${value===-1?'hit':''} ${e.lastCell===i?'latest':''} ${effects.some(x=>x.position===i)?'revealing':''}`} data-number={value} aria-label={`第${Math.floor(i/e.size)+1}行第${i%e.size+1}列${e.flags.includes(i)?'已插旗':value===null?'未揭开':value===-1?'地雷':`${value}颗邻雷`}`} disabled={busy||s.done||value!==null} onClick={()=>send({cell:i,mode})}>{e.flags.includes(i)?'🚩':value===null?'':value===-1?'💥':value||'·'}</button>)}</div>
   <div className="adventure-tip"><Flag size={16}/><p>数字是周围 8 格的地雷数。插旗后不会误点揭开；取消旗子后可继续排查。</p></div><div className="team-contributions">{names.map((name,p)=><span key={p}>{p===0?'🐰':'🦊'} {name} <b>{s.scores?.[p]||0}</b> 安全格</span>)}</div>
  </section>;
 }
 if(e.kind==='circuit')return <section className="adventure-play circuit-play" aria-label="电路修复棋盘"><div className="circuit-levels">{[0,1,2].map(stage=><div key={stage} className={e.stage>stage?'complete':e.stage===stage?'current':''}><span>{e.stage>stage?'✓':stage+1}</span><small>{stage+3} × {stage+3}</small></div>)}</div>
  <div className="adventure-stats"><div><span>点亮线路</span><b>{e.powered.length}<small> / {e.size**2}</small></b></div><div><span>本关旋转</span><b>{e.stageMoves}<small> 次</small></b></div></div><p className="adventure-turn" aria-live="polite">{s.done?'三关全部点亮，小屋又亮了一点！':e.stageComplete?'这一关已接通，准备好一起去下一关。':'从左上角电源出发，转动线路，让每一格都亮起。'}</p>
  <div className="circuit-board" style={{gridTemplateColumns:`repeat(${e.size},1fr)`}}>{e.pipes.map((pipe,i)=><button key={`${Math.min(e.stage,2)}:${i}`} className={`circuit-tile ${e.powered.includes(i)?'powered':''} ${i===e.source?'source':''} ${effects.some(x=>x.position===i)?'rotating':''}`} aria-label={`第${Math.floor(i/e.size)+1}行第${i%e.size+1}列线路${e.powered.includes(i)?'已通电':'未通电'}，点击旋转`} disabled={busy||s.done||e.stageComplete||pipe===15} onClick={()=>send({cell:i,round:e.stage})}><svg viewBox="0 0 100 100" aria-hidden="true">{[[50,0],[100,50],[50,100],[0,50]].map(([x,y],d)=>pipe&(1<<d)?<line key={d} x1="50" y1="50" x2={x} y2={y}/>:null)}<circle cx="50" cy="50" r="12"/>{i===e.source&&<text x="50" y="56" textAnchor="middle">ϟ</text>}</svg></button>)}</div>
  {e.stageComplete&&!s.done&&<button className="primary wide circuit-next" disabled={busy} onClick={()=>send({advance:true,round:e.stage})}>一起进入第 {e.stage+2} 关 <ChevronRight size={17}/></button>}
  <div className="adventure-tip"><Zap size={17}/><p>两边接口都对齐，电流才会通过。亮起的线路帮助你们判断下一步，不限步数。</p></div><div className="team-contributions">{names.map((name,p)=><span key={p}>{p===0?'🐰':'🦊'} {name} <b>{s.scores?.[p]||0}</b> 次旋转</span>)}</div>
 </section>;
 const myTurn=s.turn===slot&&!s.done;
 return <section className="adventure-play dots-play" aria-label="点格围地棋盘"><div className="dots-players">{names.map((name,p)=><div key={p} className={`dots-player p${p} ${s.turn===p&&!s.done?'current':''}`}><span>{p===0?'🐰':'🦊'}</span><div><b>{name}{p===slot?'（你）':''}</b><small>{s.turn===p&&!s.done?'正在落线':'已围住的格子'}</small></div><strong>{s.scores?.[p]||0}</strong></div>)}</div><p className="adventure-turn" aria-live="polite">{s.done?'16 个格子都找到主人啦':myTurn?e.lastBoxes.length?'你围住了格子，可以继续连线！':'轮到你，点两个圆点之间的空白连线':`等待${names[s.turn||0]}连线`}</p>
  <div className="dots-board"><div className="dots-inner">
   {e.boxes.map((owner,i)=><div key={`box:${i}`} className={`dots-box ${owner===null?'':'p'+owner} ${e.lastBoxes.includes(i)?'claimed':''}`} style={{left:`${i%e.size/e.size*100}%`,top:`${Math.floor(i/e.size)/e.size*100}%`,width:`${100/e.size}%`,height:`${100/e.size}%`}}>{owner===null?'':owner===0?'🐰':'🦊'}</div>)}
   {Array.from({length:(e.size+1)**2},(_,i)=><i key={`point:${i}`} className="dots-point" style={{left:`${i%(e.size+1)/e.size*100}%`,top:`${Math.floor(i/(e.size+1))/e.size*100}%`}}/>)}
   {(s.board||[]).map((owner,i)=>{const horizontal=i<e.size*(e.size+1),local=horizontal?i:i-e.size*(e.size+1),row=Math.floor(local/(horizontal?e.size:e.size+1)),col=local%(horizontal?e.size:e.size+1);return <button key={`edge:${i}`} className={`dots-edge ${horizontal?'horizontal':'vertical'} ${owner===null?'open':'p'+owner} ${effects.some(x=>x.position===i)?'placed':''}`} style={{left:`${(col+(horizontal?.5:0))/e.size*100}%`,top:`${(row+(horizontal?0:.5))/e.size*100}%`}} disabled={busy||!myTurn||owner!==null} aria-label={`${horizontal?'横线':'竖线'}第${row+1}行第${col+1}列${owner===null?'未连接':'已连接'}`} onClick={()=>send({cell:i})}/>;})}
  </div></div><div className="adventure-tip"><span>✦</span><p>围住一个格子得 1 分，还能继续连线。小心别把最后一条边留给对方。</p></div>
 </section>;
}
