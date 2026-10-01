import {env} from 'cloudflare:workers';
import BaseApp from './components/BaseApp';
import {getChatGPTUser} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getChatGPTUser();return <BaseApp standalone={env.AUTH_MODE==='key'} signedIn={!!user} displayName={user?.fullName||''}/>;}
