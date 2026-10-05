'use client';
import {createContext} from 'react';
import type {Stroke} from '@/src/games/drawing';
import type {PreviewMessage} from '@/src/realtime/protocol';
export type DrawingConnection={gameId:string;gameEpoch:string;connected:boolean;reset:number;previews:Stroke[];send:(message:PreviewMessage)=>boolean;drafts:Map<string,Stroke[]>};
export const DrawingRealtimeContext=createContext<DrawingConnection|null>(null);
