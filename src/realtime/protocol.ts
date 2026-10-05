import type {BaseStore} from '../server/store.ts';
import type {Stroke} from '../games/drawing.ts';
export type RoomSnapshot=Awaited<ReturnType<BaseStore['mine']>>;
export type Epoch=string;
export type Presence='online'|'away'|'offline';
export type PreviewMessage={v:1;type:'preview';gameId:string;gameEpoch:string;strokeId:string;seq:number;offset:number;color:number;width:number;tool:'pen'|'eraser';points:number[][]};
export type ClientMessage=PreviewMessage|{v:1;type:'visibility';visible:boolean}|{v:1;type:'version-check';version:number}|{v:1;type:'preview-resync';gameId:string;gameEpoch:string;strokeId:string};
export type ServerMessage={v:1;type:'hello';connectionId:string;epoch:Epoch;snapshot:RoomSnapshot;presence:[Presence,Presence]}|{v:1;type:'snapshot';epoch:Epoch;snapshot:RoomSnapshot}|{v:1;type:'presence';slots:[Presence,Presence]}|PreviewMessage|{v:1;type:'preview-reset';gameEpoch:string}|{v:1;type:'preview-full';gameEpoch:string;stroke:Stroke};
const integer=(x:unknown,min:number,max:number)=>typeof x==='number'&&Number.isInteger(x)&&x>=min&&x<=max;
const id=(x:unknown)=>typeof x==='string'&&x.length>0&&x.length<=160;
export function parseClientMessage(raw:string):ClientMessage{
 if(new TextEncoder().encode(raw).length>8192)throw Error('Packet too large');
 const m=JSON.parse(raw);if(!m||Array.isArray(m)||m.v!==1)throw Error('Invalid protocol');
 let keys:string[];
 switch(m.type){
 case 'visibility':keys=['v','type','visible'];if(typeof m.visible!=='boolean')throw Error('Invalid visibility');break;
 case 'version-check':keys=['v','type','version'];if(!integer(m.version,0,Number.MAX_SAFE_INTEGER))throw Error('Invalid version');break;
 case 'preview-resync':keys=['v','type','gameId','gameEpoch','strokeId'];if(!id(m.gameId)||!id(m.gameEpoch)||!id(m.strokeId))throw Error('Invalid drawing identity');break;
 case 'preview':keys=['v','type','gameId','gameEpoch','strokeId','seq','offset','color','width','tool','points'];
  if(!id(m.gameId)||!id(m.gameEpoch)||!id(m.strokeId)||!integer(m.seq,1,Number.MAX_SAFE_INTEGER)||!integer(m.offset,0,239)||!integer(m.color,0,7)||!integer(m.width,2,40)||!['pen','eraser'].includes(m.tool)||!Array.isArray(m.points)||m.points.length<1||m.points.length>60||m.offset+m.points.length>240||!m.points.every((p:unknown)=>Array.isArray(p)&&p.length===2&&p.every(x=>integer(x,0,1000))))throw Error('Invalid preview');break;
 default:throw Error('Unknown message');
 }
 if(Object.keys(m).some(k=>!keys.includes(k)))throw Error('Unknown field');return m;
}
export function drawingEpoch(game:{id:string;state:{extra?:{round?:number;drawingRevision?:number}}}|null|undefined){return game?`${game.id}:${game.state.extra?.round||0}:${game.state.extra?.drawingRevision||0}`:'';}
