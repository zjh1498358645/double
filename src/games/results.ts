import type {State} from './engine.ts';
export const isCooperative=(id:string)=>['puzzle','maze','escape','draw','match','bomb'].includes(id);
export function cooperativeResult(s:Partial<State>){if(s.id==='bomb')return s.extra?.stage===5?'全部模块已解除，一起安全过关！':'安全机会用完了，下次一起再试';if(s.id==='escape')return s.extra?.stage===3?'三道门都打开了！':'这次没能开锁，下次一起再试';if(s.id==='match')return (s.scores?.reduce((a,b)=>a+b,0)||0)>=220?'一起过关了！':'差一点过关，再试一次？';if(s.id==='draw')return '画猜完成，留下了我们的作品';return '一起完成了，真棒！';}
