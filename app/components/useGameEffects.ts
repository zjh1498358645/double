'use client';
import {useEffect,useMemo,useRef} from 'react';
import type {VisibleState} from './GamePlay';
import {deriveEffects} from '@/src/games/presentation';
export function useGameEffects(state:VisibleState){const previous=useRef(state);const effects=useMemo(()=>deriveEffects(previous.current,state),[state]);useEffect(()=>{previous.current=state;},[state]);return effects;}
