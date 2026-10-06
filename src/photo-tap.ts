export function createPhotoTap(){let start:{x:number;y:number}|null=null,last=0;return {
 start(x:number,y:number,count:number){start=count===1?{x,y}:null;if(count!==1)last=0;},
 move(x:number,y:number,count:number){if(count!==1||start&&Math.hypot(x-start.x,y-start.y)>10){start=null;last=0;}},
 end(now:number){if(!start)return false;start=null;if(last&&now-last<300){last=0;return true;}last=now;return false;}
};}
