'use client';
import {useRef,type PointerEvent,type MouseEvent} from 'react';
import {createPhotoActivation} from '@/src/photo-tap';
export function usePhotoActivation(action?:()=>void){
 const detector=useRef(createPhotoActivation()),pointers=useRef(new Set<number>());
 return {
  onPointerDown(e:PointerEvent){if(!action||e.button!==0)return;pointers.current.add(e.pointerId);detector.current.start(e.clientX,e.clientY,pointers.current.size);},
  onPointerMove(e:PointerEvent){if(pointers.current.has(e.pointerId))detector.current.move(e.clientX,e.clientY,pointers.current.size);},
  onPointerUp(e:PointerEvent){if(pointers.current.delete(e.pointerId))detector.current.end(e.timeStamp);},
  onPointerCancel(){pointers.current.clear();detector.current.cancel();},
  onClick(e:MouseEvent){if(detector.current.consume()){e.preventDefault();e.stopPropagation();action?.();}}
 };
}
