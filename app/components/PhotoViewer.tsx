'use client';
import {useState,useEffect,useRef} from 'react';import PrivatePhoto from './PrivatePhoto';import {formatPublishedTime} from '@/src/display-time';import {photoDisplaySize} from '@/src/photo-zoom';
export default function PhotoViewer({id,caption,created}:{id:string;caption:string;created:number}){
 const [zoom,setZoom]=useState(false),[image,setImage]=useState({width:0,height:0}),[bounds,setBounds]=useState({width:1,height:1}),ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const measure=()=>setBounds({width:ref.current?.clientWidth||1,height:window.innerHeight*.6});measure();const observer=new ResizeObserver(measure);if(ref.current)observer.observe(ref.current);window.addEventListener('resize',measure);return()=>{observer.disconnect();window.removeEventListener('resize',measure);};},[]);
 const size=image.width?photoDisplaySize(image.width,image.height,bounds.width,bounds.height,zoom):undefined;
 return <><p className="photo-caption">{caption||'我们收藏的这一刻'}</p><p className="muted">发布于 {formatPublishedTime(created)}</p><div ref={ref} className={`photo-viewer ${zoom?'zoomed':''}`} data-zoom={zoom?'2':'1'}><PrivatePhoto className="full-photo" src={`/api/base/photo/${id}`} alt={caption||'我们的回忆'} download imageStyle={size} onImageLoad={(width,height)=>setImage(current=>current.width===width&&current.height===height?current:{width,height})} onDoubleClick={()=>setZoom(v=>!v)}/></div><p className="muted">双击图片放大两倍，再双击恢复；放大后可以滑动查看。</p></>;
}
