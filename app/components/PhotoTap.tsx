'use client';
import {type ReactNode} from 'react';import {usePhotoActivation} from './usePhotoActivation';
export default function PhotoTap({children,onOpen,label}:{children:ReactNode;onOpen:()=>void;label:string}){
 const activation=usePhotoActivation(onOpen);return <div className="photo-clickable" role="button" tabIndex={0} aria-label={label} {...activation}
 onKeyDown={e=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onOpen();}}}>{children}</div>;
}
