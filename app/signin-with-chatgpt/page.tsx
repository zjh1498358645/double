import {headers} from 'next/headers';
import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {readKey} from '@/src/server/key-auth';
import KeyLogin from '../components/KeyLogin';
export const dynamic='force-dynamic';
export default async function SignIn(){if(env.AUTH_MODE!=='key')redirect('/');const h=await headers();return <KeyLogin initialKey={readKey(h.get('cookie'),import.meta.env.DEV)||''}/>;}
