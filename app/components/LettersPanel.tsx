'use client';
import {useEffect,useRef,useState} from 'react';
import {Download,Search,Mail} from 'lucide-react';
import {mailboxExport,type Letter} from '@/src/mailbox-export';
import {formatPublishedTime} from '@/src/display-time';
type Props={messages:Letter[];names:string[];slot:number;roomName:string;busy:boolean;onReply:(id:string)=>void;onDelete:(id:string)=>void;onRead:(ids:string[])=>Promise<boolean>};
export default function LettersPanel(props:Props){
 const {messages,names,slot,roomName,busy,onReply,onDelete}=props;
 const [query,setQuery]=useState(''),[exportNote,setExportNote]=useState(''),list=useRef<HTMLDivElement>(null),latest=useRef(props),seen=useRef(new Map<string,number>()),sending=useRef(false),retryAt=useRef(0);latest.current=props;
 useEffect(()=>{const tick=async()=>{
  const p=latest.current,root=list.current;if(!root||document.hidden||!navigator.onLine){seen.current.clear();return;}
  const box=root.getBoundingClientRect(),now=Date.now(),ids:string[]=[];
  for(const node of root.querySelectorAll<HTMLElement>('[data-letter-id]')){
   const id=node.dataset.letterId!,m=p.messages.find(m=>m.id===id),r=node.getBoundingClientRect();
   const visible=Math.min(r.bottom,box.bottom,window.innerHeight)-Math.max(r.top,box.top,0)>=Math.min(r.height,box.height)*.6;
   if(!m?.text||m.read[p.slot]||!visible){seen.current.delete(id);continue;}
   const since=seen.current.get(id);if(since===undefined)seen.current.set(id,now);else if(now-since>=1000)ids.push(id);
  }
  if(!ids.length||p.busy||sending.current||now<retryAt.current)return;
  sending.current=true;try{if(await p.onRead(ids)){for(const id of ids)seen.current.delete(id);}else retryAt.current=Date.now()+5000;}catch{retryAt.current=Date.now()+5000;}finally{sending.current=false;}
 };const reset=()=>{seen.current.clear();};const timer=setInterval(()=>void tick(),500);document.addEventListener('visibilitychange',reset);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',reset);};},[]);
 const download=(format:'html'|'text'|'json')=>{try{const data=mailboxExport(messages,names,roomName),extension=format==='text'?'txt':format;const blob=new Blob([format==='text'?'\uFEFF':'',data[format]],{type:format==='html'?'text/html;charset=utf-8':format==='json'?'application/json':'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`我们的信箱-${new Date().toISOString().slice(0,10)}.${extension}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);setExportNote(`已导出全部 ${data.count} 条留言`);}catch{setExportNote('导出失败，请再试一次');}};
 const visible=[...messages].reverse().filter(m=>`${m.text||''}${m.authorName||names[m.author]}`.includes(query.trim()));
 return <div className="mailbox-panel"><div className="mailbox-toolbar"><span><Mail size={15}/> {messages.length} 封小信</span><details className="export-menu"><summary><Download size={15}/> 导出信箱</summary><div><button onClick={()=>download('html')}>网页版 · 方便阅读</button><button onClick={()=>download('text')}>文字版 · 方便保存</button><button onClick={()=>download('json')}>数据备份 · JSON</button></div></details></div>
 <label className="library-search mail-search"><Search size={16}/><input aria-label="搜索信件" placeholder="找一句话，或一个人的名字" value={query} onChange={e=>{setQuery(e.target.value);seen.current.clear();}}/></label>
 <p className="mailbox-note">留言在屏幕中停留后标记已读</p>{exportNote&&<p className="mailbox-note" role="status">{exportNote}</p>}
 <div className="letters-list upgraded-letters" ref={list}>{visible.map(m=><article key={m.id} data-letter-id={m.id} className={m.own?'own':''}><div><b>{m.authorName||names[m.author]}</b><small>{formatPublishedTime(m.created)}</small></div>{m.parentId&&<blockquote>回复：{messages.find(x=>x.id===m.parentId)?.text||'原留言已删除'}</blockquote>}<p>{m.text||'这条留言已被作者收回'}</p><footer><span className={`letter-read ${m.read[1-slot]?'read':''}`}>{m.own?(m.read[1-slot]?'✓ 对方已读':'○ 对方未读'):!m.read[slot]?'新留言':''}</span>{m.text&&<><button className="text-button" onClick={()=>onReply(m.id)}>回复</button>{m.own&&<button className="text-button" disabled={busy} onClick={()=>onDelete(m.id)}>收回</button>}</>}</footer></article>)}{!visible.length&&<div className="mini-empty">{query?'没有找到相关留言':'第一句想说的话，会是什么呢？'}</div>}</div></div>;
}
