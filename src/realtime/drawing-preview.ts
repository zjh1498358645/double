import {visibleStrokes,type Stroke} from '../games/drawing.ts';
import type {PreviewMessage} from './protocol.ts';
export function createPreviewPublisher(emit:(m:PreviewMessage)=>boolean){
 const lines=new Map<string,{stroke:Stroke;gameId:string;gameEpoch:string;offset:number;seq:number}>();
 return {append(stroke:Stroke,gameId:string,gameEpoch:string){const old=lines.get(stroke.id);lines.set(stroke.id,{stroke:{...stroke,points:stroke.points.map(p=>[...p])},gameId,gameEpoch,offset:old?.offset||0,seq:old?.seq||0});},flush(){for(const line of lines.values()){if(line.offset>=line.stroke.points.length)continue;const s=line.stroke,points=s.points.slice(line.offset,line.offset+60);const m:PreviewMessage={v:1,type:'preview',gameId:line.gameId,gameEpoch:line.gameEpoch,strokeId:s.id,seq:line.seq+1,offset:line.offset,color:s.color,width:s.width,tool:s.tool,points};if(emit(m)){line.offset+=points.length;line.seq++;}break;}},reset(){lines.clear();}};
}
export function mergeDrawingLayers(saved:Stroke[],previews:Stroke[],pending:Stroke[],live:Stroke|null){return visibleStrokes(saved,[...previews,...pending],live);}
