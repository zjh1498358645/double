'use client';
import {useEffect,useRef,useState,useCallback} from 'react';
import {createRealtimeClient,type ConnectionStatus} from '@/src/realtime/client';
import {drawingEpoch,type RoomSnapshot,type Presence,type PreviewMessage} from '@/src/realtime/protocol';
import {applyPreview,type PreviewLayer} from '@/src/realtime/reducer';
export function useRealtime({roomId,enabled,standalone,onSnapshot,getVersion,refresh}:{roomId:string|null;enabled:boolean;standalone:boolean;onSnapshot:(mine:RoomSnapshot)=>void;getVersion:()=>number;refresh:()=>Promise<void>}){
 const [status,setStatus]=useState<ConnectionStatus>('offline'),[presence,setPresence]=useState<[Presence,Presence]>(['offline','offline']),[layer,setLayer]=useState<PreviewLayer>({epoch:'',strokes:{},gaps:[]}),[previewReset,setPreviewReset]=useState(0);
 const client=useRef<ReturnType<typeof createRealtimeClient>|null>(null),epoch=useRef(''),game=useRef(''),callbacks=useRef({onSnapshot,getVersion,refresh});callbacks.current={onSnapshot,getVersion,refresh};
 useEffect(()=>{if(!enabled||!roomId)return;let alive=true;
  const realtime=createRealtimeClient({getTicket:async()=>{const response=await fetch('/api/base/realtime-ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('实时连接未就绪');const ticket=await response.json() as {url:string};const url=new URL(ticket.url,standalone?'https://double-secret-base-api.pages.dev':location.origin);url.protocol=url.protocol==='https:'?'wss:':'ws:';return {url:url.href};},onStatus:s=>{if(alive)setStatus(s);},onMessage:m=>{if(!alive)return;
   if(m.type==='hello'||m.type==='snapshot'){if(m.type==='hello'){epoch.current=m.epoch;setPresence(m.presence);}else if(m.epoch!==epoch.current){void callbacks.current.refresh();return;}callbacks.current.onSnapshot(m.snapshot);const next=drawingEpoch(m.snapshot.room?.game);game.current=m.snapshot.room?.game?.id||'';setLayer(old=>old.epoch!==next?{epoch:next,strokes:{},gaps:[]}:old);if(m.type==='hello')realtime.send({v:1,type:'visibility',visible:!document.hidden});}
   else if(m.type==='presence')setPresence(m.slots);
   else if(m.type==='preview-reset'){setLayer({epoch:m.gameEpoch,strokes:{},gaps:[]});setPreviewReset(n=>n+1);}
   else if(m.type==='preview-full')setLayer(old=>old.epoch!==m.gameEpoch?old:{...old,strokes:{...old.strokes,[m.stroke.id]:{...m.stroke,seq:0}},gaps:old.gaps.filter(id=>id!==m.stroke.id)});
   else if(m.type==='preview')setLayer(old=>applyPreview(old,m));
  }});client.current=realtime;realtime.start();
  const visible=()=>{realtime.send({v:1,type:'visibility',visible:!document.hidden});if(!document.hidden){void callbacks.current.refresh();if(client.current===realtime){realtime.stop();realtime.start();}}};const check=setInterval(async()=>{if(document.hidden)return;try{const response=await fetch('/api/base/version',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)return;const data=await response.json() as {roomId:string|null;version:number;epoch:string};if(!alive)return;if(data.roomId!==roomId||data.epoch!==epoch.current||data.version!==callbacks.current.getVersion())await callbacks.current.refresh();realtime.send({v:1,type:'version-check',version:callbacks.current.getVersion()});}catch{}},15000);
  document.addEventListener('visibilitychange',visible);window.addEventListener('online',visible);return()=>{alive=false;clearInterval(check);document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',visible);realtime.stop();client.current=null;epoch.current='';game.current='';};
 },[roomId,enabled,standalone]);
 useEffect(()=>{for(const strokeId of layer.gaps)client.current?.send({v:1,type:'preview-resync',gameId:game.current,gameEpoch:layer.epoch,strokeId});},[layer.gaps,layer.epoch]);
 const sendPreview=useCallback((m:PreviewMessage)=>client.current?.send(m)||false,[]);
 return {status,presence,previews:layer,previewReset,sendPreview};
}
