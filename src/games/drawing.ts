export const drawingInks=['#e65c66','#efad32','#54a77c','#498bc9','#9465bc','#303b45','#e785ae','#975e40'];
export type Stroke={id:string;color:number;width:number;tool:'pen'|'eraser';points:number[][]};
export function validateStroke(value:unknown):Stroke{
 const s=value as Stroke;
 if(!s||typeof s.id!=='string'||!/^[\w-]{1,64}$/.test(s.id)||!Number.isInteger(s.color)||s.color<0||s.color>=drawingInks.length||!Number.isInteger(s.width)||s.width<2||s.width>40||!['pen','eraser'].includes(s.tool)||!Array.isArray(s.points)||s.points.length<1||s.points.length>240||s.points.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isInteger(n)||n<0||n>1000)))throw Error('画笔数据无效，请重新画这一笔');
 return {id:s.id,color:s.color,width:s.width,tool:s.tool,points:s.points.map(p=>[...p])};
}
export function strokePath(points:number[][]){if(!points.length)return '';if(points.length===1)return `M${points[0].join(' ')} l0.1 0`;return `M${points[0].join(' ')} `+points.slice(1).map(p=>`L${p.join(' ')}`).join(' ');}
