'use client';
import {useRef,type ReactNode} from 'react';import {createPhotoTap} from '@/src/photo-tap';
export default function PhotoTap({children,onOpen,label}:{children:ReactNode;onOpen:()=>void;label:string}){
 const taps=useRef(createPhotoTap());return <div className="photo-clickable" role="button" tabIndex={0} aria-label={label} onDoubleClick={onOpen}
 onTouchStart={e=>{const p=e.touches[0];if(p)taps.current.start(p.clientX,p.clientY,e.touches.length);}}
 onTouchMove={e=>{const p=e.touches[0];if(p)taps.current.move(p.clientX,p.clientY,e.touches.length);}}
 onTouchEnd={e=>{if(taps.current.end(Date.now())){e.preventDefault();onOpen();}}}
 onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onOpen();}}}>{children}</div>;
}
