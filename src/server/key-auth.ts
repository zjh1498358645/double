export const KEY_COOKIE='__Host-hideaway_key';
export function newKey(){return [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function readKey(cookie:string|null,dev=false){const name=dev?'hideaway_dev_key':KEY_COOKIE;const value=(cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);return value&&/^[a-f0-9]{64}$/.test(value)?value:null;}
export async function keyIdentity(key:string){if(!/^[a-f0-9]{64}$/.test(key))return null;const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('hideaway-account:'+key));return 'key_'+[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function keyCookie(key:string,secure:boolean){return `${secure?KEY_COOKIE:'hideaway_dev_key'}=${key}; Path=/; Max-Age=${key?31536000:0}; HttpOnly; SameSite=Lax${secure?'; Secure':''}`;}
