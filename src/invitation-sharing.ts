export type CopyResult='copied'|'manual';
export async function copyInvitation(url:string,io:{write?:(value:string)=>Promise<void>;fallback:()=>boolean}):Promise<CopyResult>{
 try{if(io.write){await io.write(url);return 'copied';}}catch{/* Embedded browsers may deny the clipboard. */}
 try{return io.fallback()?'copied':'manual';}catch{return 'manual';}
}
export async function shareInvitation(data:{title:string;text:string;url:string},io:{share?:(data:{title:string;text:string;url:string})=>Promise<void>;copy:()=>Promise<CopyResult>}):Promise<CopyResult|'shared'|'cancelled'>{
 if(io.share)try{await io.share(data);return 'shared';}catch(error){if(error&&typeof error==='object'&&'name' in error&&error.name==='AbortError')return 'cancelled';}
 return io.copy();
}
