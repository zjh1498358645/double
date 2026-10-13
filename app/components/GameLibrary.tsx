'use client';
import {useEffect,useState} from 'react';
import {Search,Heart,ChevronRight,Sparkles,Clock3} from 'lucide-react';
import {catalog,type GameId} from '@/src/games/engine';
const newGames=['mines','circuit','dots'];
type Props={scope:string;recent:GameId[];busy:boolean;onLaunch:(id:GameId)=>Promise<void>};
export default function GameLibrary({scope,recent,busy,onLaunch}:Props){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('全部'),[favorites,setFavorites]=useState<string[]>([]);
 const storageKey='hideaway:game-favorites:'+scope;
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');setFavorites(Array.isArray(saved)?saved.filter(x=>typeof x==='string'&&catalog.some(g=>g.id===x)):[]);}catch{setFavorites([]);}},[storageKey]);
 const toggle=(id:string)=>setFavorites(current=>{const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{}return next;});
 const recentGames=[...new Set(recent)].slice(0,5).map(id=>catalog.find(g=>g.id===id)).filter(g=>!!g);
 const games=catalog.filter(g=>(category==='全部'||category==='收藏'&&favorites.includes(g.id)||g.tag===category)&&`${g.name}${g.description}${g.tag}`.includes(query.trim()));
 return <div className="game-library">
  <section className="play-discovery"><div><span className="discovery-kicker"><Sparkles size={14}/> 本周新玩法</span><h2>一起动脑，也来点较量。</h2><p>排雷、接通电路、围住格子。每一局都有新变化。</p></div><div className="discovery-icons" aria-hidden="true">💡<span>🚩</span>✦</div></section>
  {recentGames.length>0&&<div className="recent-games"><span><Clock3 size={14}/> 最近玩过</span><div>{recentGames.map(g=><button key={g.id} disabled={busy} onClick={()=>onLaunch(g.id)}>{g.icon} {g.name}</button>)}</div></div>}
  <label className="library-search"><Search size={19}/><input aria-label="搜索游戏" placeholder="搜一个想一起玩的游戏" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery('')} aria-label="清空搜索">×</button>}</label>
  <div className="filter-tabs library-filters" aria-label="游戏分类">{['全部','合作','对战','默契','收藏'].map(t=><button key={t} aria-pressed={category===t} className={category===t?'active':''} onClick={()=>setCategory(t)}>{t==='收藏'?'♡ 收藏':t}</button>)}</div>
  <div className="library-count"><span>{query?'搜索结果':category==='全部'?'挑一款，邀请对方':`${category}游戏`}</span><small>{games.length} 款</small></div>
  <div className="game-grid library-grid">{games.map(g=><article key={g.id} className={`game-card ${g.color}`}>
   <div className="game-card-top"><span className={`game-icon ${g.color}`}>{g.icon}</span><button className={`favorite-game ${favorites.includes(g.id)?'saved':''}`} aria-label={`${favorites.includes(g.id)?'取消收藏':'收藏'}${g.name}`} aria-pressed={favorites.includes(g.id)} onClick={()=>toggle(g.id)}><Heart size={18} fill={favorites.includes(g.id)?'currentColor':'none'}/></button></div>
   <div className="game-card-labels"><span className="game-tag">{g.tag}</span>{newGames.includes(g.id)&&<span className="new-game-label">新游戏</span>}</div><h3>{g.name}</h3><p>{g.description}</p>
   <button className="game-launch" disabled={busy} onClick={()=>onLaunch(g.id)}><span>邀请一起玩</span><ChevronRight size={16}/></button>
  </article>)}</div>
  {!games.length&&<div className="library-empty"><span>{category==='收藏'?'♡':'⌕'}</span><h3>{category==='收藏'?'把喜欢的游戏留在这里':'没有找到这款游戏'}</h3><p>{category==='收藏'?'点游戏卡片上的爱心，下次就能很快找到。':'换个关键词，或看看其他分类。'}</p><button className="outline" onClick={()=>{setQuery('');setCategory('全部');}}>看看全部游戏</button></div>}
  <p className="section-footnote">完整玩完一局获得 5 颗星星 · 每日无获取上限</p>
 </div>;
}
