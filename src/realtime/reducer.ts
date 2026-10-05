import type {RoomSnapshot,PreviewMessage} from './protocol.ts';
import type {Stroke} from '../games/drawing.ts';
export type PreviewLayer={epoch:string;strokes:Record<string,Stroke&{seq:number}>;gaps:string[]};
export function applySnapshot(previous:RoomSnapshot,next:RoomSnapshot,epoch:string,currentEpoch:string):RoomSnapshot{
 if(epoch!==currentEpoch)return previous;
 if(next.roomId===previous.roomId&&next.version<=previous.version)return previous;return next;
}
export function applyPreview(layer:PreviewLayer,m:PreviewMessage):PreviewLayer{
 if(m.gameEpoch!==layer.epoch)return layer;const previous=layer.strokes[m.strokeId];
 if(previous&&m.seq<=previous.seq)return layer;
 const length=previous?.points.length||0;
 if(m.offset>length)return {...layer,gaps:[...new Set([...layer.gaps,m.strokeId])]};
 if(previous&&(previous.color!==m.color||previous.width!==m.width||previous.tool!==m.tool))return layer;
 const points=previous?previous.points.map(p=>[...p]):[];
 for(let i=0;i<m.points.length;i++){const at=m.offset+i;if(at<points.length){if(points[at][0]!==m.points[i][0]||points[at][1]!==m.points[i][1])return layer;}else points.push([...m.points[i]]);}
 return {...layer,strokes:{...layer.strokes,[m.strokeId]:{id:m.strokeId,color:m.color,width:m.width,tool:m.tool,points,seq:m.seq}},gaps:layer.gaps.filter(id=>id!==m.strokeId)};
}
