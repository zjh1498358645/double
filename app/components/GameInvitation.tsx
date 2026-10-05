'use client';
import {catalog,type Slot} from '@/src/games/engine';
import type {snapshot} from '@/src/server/model';
export default function GameInvitation({game,names,slot,busy,onAccept,onDecline}:{game:NonNullable<ReturnType<typeof snapshot>['game']>;names:string[];slot:Slot;busy:boolean;onAccept:()=>Promise<void>;onDecline:()=>Promise<void>}){
 if(game.status!=='invited'||game.creator===slot)return null;
 return <section className="incoming-game-invite" role="region" aria-label="收到游戏邀请"><div className="invite-heading"><span>🎮</span><div><small>好友邀请</small><h3>{names[game.creator]}想和你玩{catalog.find(g=>g.id===game.state.id)?.name}</h3></div></div><div className="invite-avatar-row">{names.map((name,i)=><div key={i}><span>{i===0?'🐰':'🦊'}</span><b>{name}</b><small>{i===game.creator?'✓ 已准备':'等待你的回应'}</small></div>)}</div><div className="invite-buttons"><button className="outline" disabled={busy} onClick={()=>void onDecline()}>这次先不玩</button><button className="primary" disabled={busy} onClick={()=>void onAccept()}>{busy?'正在处理…':'接受，进入游戏'}</button></div></section>;
}
