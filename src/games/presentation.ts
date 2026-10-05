import type {State} from './engine.ts';
export type GameEffect={id:string;type:'place'|'flip'|'reveal'|'match'|'card';position:number};
export function deriveEffects(before:Partial<State>,after:Partial<State>):GameEffect[]{
 if(before.id!==after.id)return [];const effects:GameEffect[]=[];const stamp=`${after.id}:${after.moves||0}:${after.extra?.round||0}`;
 if(['tictactoe','connect4','gomoku','reversi','memory','match','fleet'].includes(after.id||''))for(let i=0;i<(after.board?.length||0);i++){const value=after.board![i],old=before.board?.[i];if(value===old)continue;const type=after.id==='memory'?'reveal':after.id==='match'?'match':after.id==='reversi'&&old!==null?'flip':'place';effects.push({id:`${stamp}:${i}:${value}`,type,position:i});}
 if(after.id==='cards'&&before.extra?.pile?.[0]!==after.extra?.pile?.[0])effects.push({id:`${stamp}:discard:${after.extra?.pile?.[0]}`,type:'card',position:0});return effects;
}
