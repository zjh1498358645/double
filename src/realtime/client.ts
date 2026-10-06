import type {ClientMessage,ServerMessage} from './protocol.ts';
export type ConnectionStatus='connecting'|'connected'|'reconnecting'|'offline';
type Timer=ReturnType<typeof setTimeout>;
type Clock={now:()=>number;random:()=>number;setTimeout:(fn:()=>void,ms:number)=>Timer;clearTimeout:(id:Timer)=>void};
type Socket=Pick<WebSocket,'readyState'|'send'|'close'|'onopen'|'onclose'|'onerror'|'onmessage'>;
export function createRealtimeClient(options:{getTicket:()=>Promise<{url:string}>;onMessage:(message:ServerMessage)=>void;onStatus:(status:ConnectionStatus)=>void;WebSocketImpl?:new(url:string)=>Socket;clock?:Clock}){
 const clock=options.clock||{now:Date.now,random:Math.random,setTimeout:(fn,ms)=>setTimeout(fn,ms),clearTimeout:id=>clearTimeout(id)};const SocketClass=options.WebSocketImpl||WebSocket;
 let active=false,generation=0,socket:Socket|null=null,timer:Timer|undefined,heartbeat:Timer|undefined,attempts=0,lastSeen=0,connected=false;
 const clear=()=>{if(timer!==undefined)clock.clearTimeout(timer);if(heartbeat!==undefined)clock.clearTimeout(heartbeat);timer=heartbeat=undefined;};
 const schedule=(token:number)=>{if(!active||token!==generation)return;connected=false;options.onStatus('reconnecting');const delay=[1000,2000,4000,8000,15000][Math.min(attempts++,4)]*(0.8+clock.random()*0.4);timer=clock.setTimeout(()=>void connect(),delay);};
 const beat=(token:number)=>{heartbeat=clock.setTimeout(()=>{if(!active||token!==generation)return;if(clock.now()-lastSeen>=45000){socket?.close();return;}if(socket?.readyState===1)socket.send('ping');beat(token);},15000);};
 const connect=async()=>{if(!active)return;const token=++generation;connected=false;options.onStatus(attempts?'reconnecting':'connecting');try{const ticket=await options.getTicket();if(!active||token!==generation)return;const ws=new SocketClass(ticket.url);socket=ws;const valid=()=>active&&token===generation&&socket===ws;
  // Timeout includes a socket which opens but never sends the authenticated hello.
  timer=clock.setTimeout(()=>{if(valid())ws.close();},15000);
  ws.onopen=()=>{if(!valid())return;lastSeen=clock.now();beat(token);};
  ws.onmessage=event=>{if(!valid())return;lastSeen=clock.now();if(event.data==='pong')return;let message:ServerMessage;try{message=JSON.parse(String(event.data));if(message.v!==1)return;}catch{return;}if(message.type==='hello'){connected=true;attempts=0;if(timer!==undefined)clock.clearTimeout(timer);options.onStatus('connected');}options.onMessage(message);};
  ws.onclose=()=>{if(!valid())return;clear();socket=null;schedule(token);};ws.onerror=()=>{if(valid())ws.close();};
 }catch{if(active&&token===generation)schedule(token);}};
 return {start(){if(active)return;active=true;attempts=0;void connect();},stop(){active=false;generation++;connected=false;clear();const previous=socket;socket=null;previous?.close();options.onStatus('offline');},send(message:ClientMessage){if(!connected||socket?.readyState!==1)return false;try{socket.send(JSON.stringify(message));return true;}catch{return false;}}};
}
