import type {Presence} from './protocol.ts';
export type TicketIdentity={roomId:string;userId:string;slot:0|1;epoch:string;origin:string};
type TicketRecord=TicketIdentity&{expires:number};
type Storage={get<T>(key:string):Promise<T|undefined>;put(key:string,value:unknown):Promise<unknown>;delete(key:string):Promise<unknown>};
export async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join('');}
export async function memberEpoch(members:({id:string}|null)[]){return digest(JSON.stringify(members.map(m=>m?.id||'')));}
export class TicketVault{
 private storage:Storage;private now:()=>number;
 constructor(storage:Storage,now:()=>number=Date.now){this.storage=storage;this.now=now;}
 async issue(identity:TicketIdentity){const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');await this.storage.put('ticket:'+await digest(token),{...identity,expires:this.now()+60000});return token;}
 async consume(token:string,origin:string):Promise<{ok:false}|{ok:true;identity:TicketRecord}>{if(!/^[a-f0-9]{64}$/.test(token))return {ok:false};const key='ticket:'+await digest(token),record=await this.storage.get<TicketRecord>(key);if(!record||record.expires<=this.now()||record.origin!==origin)return {ok:false};await this.storage.delete(key);return {ok:true,identity:record};}
}
export function connectionPresence(connections:{slot:0|1;visible:boolean;lastSeen:number}[],now:number):[Presence,Presence]{return [0,1].map(slot=>{const live=connections.filter(c=>c.slot===slot&&now-c.lastSeen<45000);return live.some(c=>c.visible)?'online':live.length?'away':'offline';}) as [Presence,Presence];}
export function allowPacket(rate:{since:number;count:number},now:number){if(now-rate.since>=1000){rate.since=now;rate.count=0;}return ++rate.count<=30;}
