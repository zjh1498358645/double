'use client';
import PrivatePhoto from './PrivatePhoto';import {formatPublishedTime} from '@/src/display-time';
export default function PhotoViewer({id,caption,created}:{id:string;caption:string;created:number}){
 return <div className="single-photo-view"><div className="single-photo-stage"><PrivatePhoto className="single-photo-image" src={`/api/base/photo/${id}`} alt={caption||'我们的回忆'} download/></div><footer><p className="photo-caption">{caption||'我们收藏的这一刻'}</p><p className="muted">发布于 {formatPublishedTime(created)}</p></footer></div>;
}
