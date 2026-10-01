'use client';
import {decorations} from '@/src/server/model';
type Props={layout?:Record<string,string>;onOpen:(place:string)=>void};
export default function RoomScene({layout={},onOpen}:Props){const positions:Record<string,[number,number]>={window:[485,204],table:[360,330],shelf:[161,220],sofa:[240,334],wall:[360,133],floor:[422,420]};
 return <div className="room-scene"><svg viewBox="0 0 740 520" aria-label="我们的小屋：窗边有阳光，沙发旁有信箱和游戏机" role="img">
 <defs><pattern id="wallpaper" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="#c6b69c" opacity=".3"/></pattern><pattern id="floorboards" width="100" height="32" patternUnits="userSpaceOnUse" patternTransform="skewX(-25)"><path d="M0 0h100v32H0z" fill="#e2b990" stroke="#ce9f79" strokeWidth="1"/></pattern><linearGradient id="daylight" x2="0" y2="1"><stop stopColor="#d3e2da"/><stop offset="1" stopColor="#f5e8c6"/></linearGradient><filter id="softshadow"><feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#927357" floodOpacity=".1"/></filter></defs>
 <ellipse cx="371" cy="462" rx="301" ry="27" fill="#b3ab94" opacity=".13"/>
 <g stroke="#735c46" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" filter="url(#softshadow)">
 <path d="M86 139 372 65 653 140V383L373 480 86 383Z" fill="#eddfc5"/>
 <path d="M86 139 372 65V313L86 383Z" fill="#f3e8d3"/><path d="M372 65 653 140V383L372 313Z" fill="#eddfc5"/>
 <path d="M86 139 372 65V313L86 383Z" fill="url(#wallpaper)" stroke="none"/><path d="M372 65 653 140V383L372 313Z" fill="url(#wallpaper)" stroke="none"/>
 <path d="M86 383 372 313 653 383 373 480Z" fill="url(#floorboards)"/>
 <path d="M86 374 372 304 653 374" fill="none" stroke="#c4a580" strokeWidth="7"/>
 <path d="M78 137 370 59 661 137" fill="none" stroke="#a78160" strokeWidth="12"/><path d="M82 137 370 63 657 139" fill="none" stroke="#dfbea0" strokeWidth="5"/>
 <path d="M88 140v235M653 141v237" stroke="#9f7757" strokeWidth="10"/>
 <path d="M477 135 580 162V267L477 240Z" fill="#a58160"/><path d="M485 144 572 168V254L485 233Z" fill="url(#daylight)"/>
 <path d="M486 210q22-25 41-12 20-26 45 6v50l-87-22z" fill="#a9bba0" stroke="none"/><path d="M528 157v85M485 192l87 23" stroke="#a58160" strokeWidth="5"/>
 <path d="M462 124q-6 52 2 126l18-13q-8-58 3-104Z" fill="#dd9f86"/><path d="M586 158q12 52 8 105l-19-6q8-42 0-104Z" fill="#dd9f86"/><path d="M470 132q-3 50 4 99M583 165q9 48 2 86" fill="none" stroke="#c88572"/>
 <path d="M454 119l145 38" stroke="#8b6b4d" strokeWidth="4"/>
 <path d="M135 218 238 191V275L135 302Z" fill="#bd916a"/><path d="M144 220 230 198V268L144 291Z" fill="#e0bf99"/><path d="M142 251 229 228M184 211v69" stroke="#b38b67" strokeWidth="3"/>
 <g strokeWidth="1.4"><path d="M153 239v-17l8-2v17z" fill="#a9b79b"/><path d="M165 236v-19l8-2v19z" fill="#d7917d"/><path d="M177 233v-22l5-1v22z" fill="#e6cd88"/></g>
 <path d="M198 206v-18q-16-4-12-16 13 1 12 16 4-21 17-22 6 15-16 24" fill="#92a780"/><path d="M189 197 211 192l-4 16-15 4Z" fill="#dca080"/>
 <path d="M285 142 332 130V176L285 188Z" fill="#b99067"/><path d="M291 147 326 138V170L291 179Z" fill="#fff5df"/><path d="M300 155q8-12 16-7l-1 16-16 4Z" fill="#d89c83" stroke="none"/>
 <path d="M204 393 369 351 532 393 373 447Z" fill="#e9cf9c"/><path d="M221 393 369 360 513 393 373 436Z" fill="none" stroke="#c6a675" strokeDasharray="5 6"/>
 <path d="M171 332v45M312 297v46" strokeWidth="7" stroke="#947153"/>
 <path d="M144 303q-2-19 14-24l133-32q22-4 26 14l7 53-159 42Z" fill="#aab493"/>
 <path d="M151 299q17-12 25 6v36l-21 5zM299 270q15-8 22 7v41l-20 6Z" fill="#b8c1a0"/>
 <path d="M176 321 299 291v35l-123 32Z" fill="#bdc8a7"/><path d="M182 324 293 297M239 310v33" fill="none" stroke="#8fa07d"/>
 <path d="M194 296q-5-13 11-17l18-5q13-1 14 13l-1 23-37 10Z" fill="#efd5b3"/><path d="M254 280q-4-10 8-13l17-5q11 0 13 10l-1 24-34 9Z" fill="#d89985"/>
 <path d="M337 397v-39M425 375v-39" strokeWidth="6" stroke="#a37a54"/><ellipse cx="379" cy="349" rx="61" ry="25" fill="#cfa680"/><ellipse cx="379" cy="343" rx="61" ry="25" fill="#e9c59d"/>
 <path d="M375 340v-17h15v17q-7 5-15 0Z" fill="#fbf0d7"/><path d="M390 326q12-3 10 6-2 6-10 2" fill="none"/><path d="M380 315q-4-6 1-10" fill="none" stroke="#bfa287"/>
 <path d="M527 340 584 354v53l-57-15Z" fill="#c99a70"/><path d="M532 345 579 357v22l-47-12Z" fill="#e3bb92"/><circle cx="558" cy="366" r="2" fill="#785c43"/>
 <path d="M535 331 578 342v-31l-43-11Z" fill="#8b9c82"/><path d="M540 307 573 316v21l-33-9Z" fill="#dce5c9"/><path d="M543 331h-5v7M568 338h6v7" strokeWidth="3"/>
 <path d="M595 324v-38q-21-1-14-21 15 7 14 21 0-29 19-33 12 24-18 36" fill="#8b9e75"/><path d="M580 304 610 313l-5 26-21-6Z" fill="#d99d7d"/>
 <path d="M108 332 130 326v36l-22 6Z" fill="#d78d73"/><path d="M107 333 119 343 132 327" fill="none"/>
 <path d="M455 331q-13-6-11-18l6-20 11 12 12-8 3 23q-3 13-21 11Z" fill="#e4b58a"/><path d="M450 317h1M463 319h1" strokeWidth="3"/><path d="M453 322q3 4 6 1" fill="none"/>
 <path d="M271 391q-13-5-10-20l3-7q-5-19 2-25 10-3 9 23l7-3q0-23 8-19 8 5 0 27l3 7q5 16-11 19Z" fill="#f6e9d3"/><path d="M270 377h1M284 376h1" strokeWidth="3"/><path d="M276 382h3" stroke="#cc9a8b"/>
 <path d="M307 405q-15-4-13-18l1-16 10 9 12-9 5 17q3 14-15 17Z" fill="#d79673"/><path d="M300 391h1M313 391h1" strokeWidth="3"/><path d="M303 397h5" stroke="#fff0d7"/>
 </g>
 {Object.entries(layout).map(([slot,id])=>{const pos=positions[slot],d=decorations.find(d=>d.id===id);return pos&&d?<text key={id} x={pos[0]} y={pos[1]} fontSize="32" textAnchor="middle">{d.icon}</text>:null;})}
 </svg><button className="scene-label label-mail" onClick={()=>onOpen('letters')}>💌 信箱<span>留一句想你</span></button><button className="scene-label label-game" onClick={()=>onOpen('games')}>🎮 游戏机<span>一起玩一局</span></button><button className="scene-label label-photo" onClick={()=>onOpen('photos')}>🖼️ 相册<span>收藏小日子</span></button><div className="scene-sticker">☀ 今天也有好天气</div></div>;
}
