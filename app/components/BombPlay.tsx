'use client';
import {useState,useEffect} from 'react';
import type {VisibleState} from './GamePlay';
import type {Action,Slot} from '@/src/games/engine';
const modules=['电源校准','信号解码','保险模块','核心隔离','最终解除'];
export default function BombPlay({state:s,slot,busy,onAction}:{state:VisibleState;slot:Slot;busy:boolean;onAction:(a:Action)=>Promise<boolean>}){
 const [code,setCode]=useState(''),stage=s.extra?.stage||0,mistakes=s.extra?.attempts||0;
 useEffect(()=>setCode(''),[stage]);
 return <section className="bomb-play"><div className={`bomb-device ${s.done?stage===5?'safe':'failed':''}`}><span aria-hidden="true">{s.done&&stage===5?'🛡️':'💣'}</span><h3>{s.done?stage===5?'配合成功，全部解除！':'安全机会用完了，再来一次吧':modules[stage]}</h3><p>模块 {Math.min(stage+1,5)} / 5 · 安全机会 {3-mistakes} / 3</p><div className="bomb-progress" aria-label={`已解除${stage}个模块`}>{modules.map((m,i)=><span key={m} className={i<stage?'complete':i===stage?'current':''}>{i<stage?'✓':i+1}</span>)}</div></div>
 {!s.done&&<><div className="bomb-manual"><small>你的私人仪表 · 第{slot===0?'1、3':'2、4'}位</small><div className="lock-hint">{s.extra?.bombHint}</div><p>本关偏移量：<b>{stage+1}</b></p><p>将每个读数减去偏移量；不足 0 就加 10。按原位置拼出四位解锁码，缺少的读数由对方提供。</p><p className="muted">例如读数 2、偏移量 3，解码后为 9。先在下方公屏核对线索，再提交。</p></div><form className="digit-form" onSubmit={async e=>{e.preventDefault();if(await onAction({guess:code,round:stage}))setCode('');}}><input aria-label="拆弹四位解锁码" inputMode="numeric" autoComplete="off" value={code} maxLength={4} disabled={busy} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/><button className="primary" disabled={busy||code.length!==4}>解除当前模块</button></form></>}
 </section>;
}
