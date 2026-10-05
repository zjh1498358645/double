'use client';
import {useState} from 'react';
import {Gamepad2,ChevronDown,ChevronUp} from 'lucide-react';
import {catalog,type GameId,type Slot} from '@/src/games/engine';
import type {Presence} from '@/src/realtime/protocol';
export default function FriendPanel({name,slot,presence,connected,currentGame,busy,onInvite,onContinue}:{name:string;slot:Slot;presence:Presence;connected:boolean;currentGame:boolean;busy:boolean;onInvite:(game:GameId)=>Promise<void>;onContinue:()=>void}){
 const [expanded,setExpanded]=useState(false);
 return <section className="friend-panel" aria-label="我的好友"><div className="friend-summary"><span className={`friend-avatar ${presence}`}>{slot===0?'🐰':'🦊'}<i/></span><div className="friend-name"><small>我的小屋好友</small><b>{name}</b><span>{connected?{online:'在线，可以一起玩',away:'暂离，邀请会等对方回来',offline:'离线，邀请会保留'}[presence]:'正在确认在线状态'}</span></div><button className="outline" disabled={busy} aria-expanded={expanded} onClick={()=>currentGame?onContinue():setExpanded(v=>!v)}><Gamepad2 size={17}/>{currentGame?'继续本局':'邀请一起玩'}{!currentGame&&(expanded?<ChevronUp size={14}/>:<ChevronDown size={14}/>)}</button></div>{expanded&&!currentGame&&<div className="friend-game-picker" aria-label="选择邀请的游戏">{catalog.map(g=><button key={g.id} disabled={busy} onClick={async()=>{await onInvite(g.id);setExpanded(false);}}><span>{g.icon}</span><b>{g.name}</b><small>{g.tag}</small></button>)}</div>}</section>;
}
