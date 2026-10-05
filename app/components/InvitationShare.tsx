'use client';
import {useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {Copy,Share2} from 'lucide-react';
import {invitationLink} from '@/src/invites';
import {copyInvitation,shareInvitation} from '@/src/invitation-sharing';
export default function InvitationShare({kind,value}:{kind:'invite'|'play';value:string}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');const field=useRef<HTMLTextAreaElement>(null);
 const url=invitationLink(window.location.href,kind,value),title=kind==='play'?'来小满，和我一起玩一局':'来小满，加入我们的双人小屋';
 const select=()=>{field.current?.focus();field.current?.select();field.current?.setSelectionRange(0,url.length);};
 const copy=()=>copyInvitation(url,{write:navigator.clipboard?.writeText?text=>navigator.clipboard.writeText(text):undefined,fallback:()=>{select();return document.execCommand('copy');}});
 const feedback=(result:string)=>setStatus(result==='shared'?'已交给系统分享；也可以复制链接发到微信。':result==='copied'?'邀请链接已复制！打开微信，粘贴到好友聊天中发送。':result==='cancelled'?'已取消系统分享。可以点下面的按钮复制链接。':'自动复制未成功，请长按下方完整链接，选择复制，再粘贴到微信。');
 const share=async()=>{flushSync(()=>setOpen(true));setBusy(true);try{const wechat=/MicroMessenger/i.test(navigator.userAgent);feedback(await shareInvitation({title,text:title,url},{share:!wechat&&navigator.share?data=>navigator.share(data):undefined,copy}));}finally{setBusy(false);}};
 return <div className="invitation-share"><button className="outline wide" disabled={busy} onClick={share}><Share2 size={16}/>{busy?'正在准备邀请…':kind==='play'?'分享这局邀请到微信':'分享小屋邀请到微信'}</button>
 <button className="text-button" disabled={busy} onClick={()=>{setOpen(true);void copy().then(feedback);}}><Copy size={15}/>复制邀请链接</button>
 {/* Keep a real selectable URL mounted before a gesture triggers legacy copy. */}
 <div aria-hidden={!open} className={open?'invitation-copy-panel':'invitation-copy-panel collapsed'}><p aria-live="polite">{status||'复制完整链接，粘贴到微信聊天里发给对方。'}</p><textarea tabIndex={open?0:-1} ref={field} readOnly aria-label="完整邀请链接" value={url} rows={3} onFocus={e=>e.currentTarget.select()}/><button tabIndex={open?0:-1} className="text-button" onClick={select}>选中完整链接，手动复制</button><small>{kind==='play'?'对方需是同一小屋的成员，登录后进入这一局。':'24小时有效；对方使用自己的钥匙登录并申请加入，等你确认配对。'}</small></div></div>;
}
