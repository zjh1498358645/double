'use client';
import {useEffect,useRef,useState} from 'react';
import {Send,MessageCircle} from 'lucide-react';
import type {GameMessage} from '@/src/server/model';
import type {Action,Slot} from '@/src/games/engine';
import type {VisibleState} from './GamePlay';
export default function GameChat({messages,state,slot,names,busy,onChat,onAction}:{messages:GameMessage[];state:VisibleState;slot:Slot;names:string[];busy:boolean;onChat:(text:string)=>Promise<boolean>;onAction:(a:Action)=>Promise<boolean>}){
 const [text,setText]=useState(''),[mode,setMode]=useState<'guess'|'chat'>('guess');const list=useRef<HTMLDivElement>(null);
 const guessing=state.id==='draw'&&!state.done&&state.turn!==slot,guess=guessing&&mode==='guess';
 useEffect(()=>{if(list.current)list.current.scrollTop=list.current.scrollHeight;},[messages.length,messages.at(-1)?.id]);
 useEffect(()=>{setMode('guess');},[state.extra?.round]);
 const send=async(value:string)=>{const ok=guess?await onAction({guess:value,round:state.extra?.round}):await onChat(value);if(ok)setText('');};
 const clue=state.id==='escape'&&!state.done?`我的线索：第${slot===0?'1、3':'2、4'}位是 ${state.extra?.hint}`:null;
 return <section className="game-chat"><div className="game-chat-heading"><h3><MessageCircle size={18}/>局内公屏</h3><small>只有小屋里的你们可见</small></div>
 <div ref={list} className="game-chat-log" role="log" aria-live="polite" aria-relevant="additions">{!messages.length&&<p className="muted">{state.id==='draw'?'猜测会出现在这里，也可以切换聊天交流。':'线索、提问、路线，都可以直接在这里交流。'}</p>}{messages.map(m=><div key={m.id} className={`game-bubble ${m.kind==='system'?'system':m.author===slot?'own':''}`}><small>{m.author===null?'游戏反馈':names[m.author]}{m.kind==='guess'?' · 猜测':''} · {new Date(m.created).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})}</small><p>{m.text}</p></div>)}</div>
 {clue&&<button className="outline clue-share" disabled={busy} onClick={()=>onChat(clue)}>把我的线索发到公屏</button>}
 {state.id==='maze'&&!state.done&&<div className="chat-quick">{['上','右','下','左'].filter((_,i)=>slot===0?i%2===0:i%2===1).map((d,i)=>{const direction=slot===0?i*2:i*2+1,wall=!!((state.extra?.clues?.[state.extra?.position||0]||0)&(1<<direction));return <button className="outline" disabled={busy} key={d} onClick={()=>onChat(`当前位置向${d}${wall?'有墙':'可以走'}`)}>向{d}{wall?'有墙':'可走'}</button>;})}</div>}
 {guessing&&<div className="chat-modes"><button className={mode==='guess'?'chosen':''} onClick={()=>setMode('guess')}>猜答案（剩 {6-(state.extra?.attempts||0)} 次）</button><button className={mode==='chat'?'chosen':''} onClick={()=>setMode('chat')}>聊天 / 提问</button></div>}
 <form className="game-chat-form" onSubmit={e=>{e.preventDefault();void send(text.trim());}}><input aria-label={guess?'猜画中的词':'局内聊天消息'} value={text} maxLength={guess?30:300} placeholder={guess?'这幅画是什么？':'给对方发线索或聊两句…'} onChange={e=>setText(e.target.value)}/><button className="primary" disabled={busy||!text.trim()}><Send size={17}/>{guess?'猜一下':'发送'}</button></form><small className="muted">{guess?'猜答案会计入本轮次数；聊天和提问不扣次数。':'消息失败时文字会保留；公屏保留本局最近100条消息。'}</small></section>;
}
