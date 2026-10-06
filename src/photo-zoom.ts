export function photoDisplaySize(width:number,height:number,availableWidth:number,availableHeight:number,zoomed:boolean){
 const fit=Math.min(1,Math.max(1,availableWidth)/Math.max(1,width),Math.max(1,availableHeight)/Math.max(1,height));
 const scale=fit*(zoomed?2:1);return {width:width*scale,height:height*scale};
}
