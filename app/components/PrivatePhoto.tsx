'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {usePhotoActivation} from './usePhotoActivation';
import {privatePhotos} from '@/src/photo-cache';
export default function PrivatePhoto({src,previewSrc,alt,className,loading,download=false,onDoubleClick,imageStyle,onImageLoad}:{src:string;previewSrc?:string;alt:string;className?:string;loading?:'lazy';download?:boolean;onDoubleClick?:()=>void;imageStyle?:CSSProperties;onImageLoad?:(width:number,height:number)=>void}){const [url,setUrl]=useState(''),[mime,setMime]=useState('image/jpeg'),[fullReady,setFullReady]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[visible,setVisible]=useState(loading!=='lazy'),ref=useRef<HTMLDivElement>(null);
 const activation=usePhotoActivation(onDoubleClick);
 useEffect(()=>{if(loading!=='lazy'||visible)return;if(!('IntersectionObserver' in window)){setVisible(true);return;}const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'180px'});if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[loading,visible]);
 useEffect(()=>{if(!visible)return;let disposed=false,ready=false;const urls:string[]=[];setError('');setUrl('');setFullReady(false);
  if(previewSrc)privatePhotos.load(previewSrc).then(blob=>{if(!disposed&&!ready){const u=URL.createObjectURL(blob);urls.push(u);setUrl(u);}}).catch(()=>{});
  privatePhotos.load(src).then(blob=>{if(!disposed){ready=true;const u=URL.createObjectURL(blob);urls.push(u);setMime(blob.type);setUrl(u);setFullReady(true);}}).catch(e=>{if(!disposed)setError(e instanceof Error?e.message:'照片加载失败');});
  return()=>{disposed=true;for(const u of urls)URL.revokeObjectURL(u);};},[src,previewSrc,retry,visible]);
 const retryButton=<button type="button" className="text-button" onClick={ev=>{ev.stopPropagation();setRetry(n=>n+1);}}>重新加载</button>;
 return <div ref={ref} className={`private-photo ${download?'photo-download':''}`}>{url?<><img src={url} alt={alt} className={className} decoding="async" {...activation} draggable={false} style={imageStyle} onLoad={e=>{if(fullReady)onImageLoad?.(e.currentTarget.naturalWidth,e.currentTarget.naturalHeight);}} onError={()=>{setUrl('');setError('照片无法显示，请重试');}}/>{previewSrc&&!fullReady&&<div className="photo-load-note" role="status">{error?<>{error} {retryButton}</>:'正在加载原图，先显示预览…'}</div>}{download&&fullReady&&<a className="outline photo-save" href={url} download={mime==='image/png'?'小满-收藏照片.png':mime==='image/webp'?'小满-收藏照片.webp':'小满-收藏照片.jpg'}>保存原图</a>}</>:<div className="photo-placeholder" role="status">{error?<><span>{error}</span>{retryButton}</>:<span>照片加载中…</span>}</div>}</div>;
}
