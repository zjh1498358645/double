export function syncDelay(playing:boolean,failures:number){return failures>0?[5000,10000,30000][Math.min(failures-1,2)]:playing?500:2000;}
/** Coalesce polls, but never lose a required read after a write. */
export function createRefreshCoordinator(fetcher:(force:boolean)=>Promise<void>){
 let current:Promise<void>|null=null,queued:Promise<void>|null=null;
 const run=(force:boolean)=>{const task=fetcher(force).finally(()=>{if(current===task)current=null;});current=task;return task;};
 return (force=false):Promise<void>=>{if(force&&queued)return queued;if(current){if(!force)return current;const next=current.then(()=>{if(queued===next)queued=null;return run(true);});queued=next;return next;}return run(force);};
}
