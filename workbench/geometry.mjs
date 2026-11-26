// Independent V0.2 parametric concept engine. No electrical crossing model.
export const names=["tri-braid","hex-braid","golden-branch","mycelium","pocket-mesh","hex-mesh","spiral","fractal-braid","phi-hybrid"];
export const defaults={size:100,strands:3,turns:3,depth:3,ratio:0.618,cells:2};
export const ranges={size:[10,1000,1],strands:[2,9,1],turns:[1,9,1],depth:[1,5,1],ratio:[0.35,0.75,0.001],cells:[1,6,1]};
export function validate(input={}){
 const p={...defaults,...input};
 for(const [k,[lo,hi,step]] of Object.entries(ranges)){
  if(typeof p[k]!=="number"||!Number.isFinite(p[k])||p[k]<lo||p[k]>hi||(step===1&&!Number.isInteger(p[k]))) throw new RangeError(k);
 }
 return Object.fromEntries(Object.keys(defaults).map(k=>[k,p[k]]));
}
const tau=2*Math.PI;
function braid(n,turns){return Array.from({length:n},(_,k)=>Array.from({length:181},(_,t)=>[50+25*Math.sin(t*tau*turns/180+tau*k/n),5+90*t/180]));}
function square(cells){let p=[]; const d=90/cells;
 for(let i=0;i<cells;i++)for(let j=0;j<cells;j++)for(const f of [.2,.4]){
 const x=5+d*(i+.5),y=5+d*(j+.5),r=d*f;
 p.push([[x-r,y-r],[x+r,y-r],[x+r,y+r],[x-r,y+r],[x-r,y-r]]);
 }return p;}
function hex(cells){let p=[];const d=90/(cells+0.5),r=d*.45;
 for(let i=0;i<cells;i++)for(let j=0;j<cells;j++){
 const x=5+d*(i+.5+(j%2)*.5),y=5+d*(j+.5);
 p.push(Array.from({length:7},(_,k)=>[x+r*Math.cos(k*tau/6),y+r*Math.sin(k*tau/6)]));
 }return p;}
function tree(depth,ratio,mycelium){const p=[],leaves=[];const len=38*(1-ratio)/(1-ratio**(depth+1));
 function grow(x,y,l,a,d){const u=x+l*Math.cos(a),v=y+l*Math.sin(a);p.push([[x,y],[u,v]]);if(d===0){leaves.push([u,v]);return;}
 for(const delta of [-.65,.65])grow(u,v,l*ratio,a+delta,d-1);}
 grow(50,88,len,-Math.PI/2,depth);
 if(mycelium){leaves.sort((a,b)=>a[0]-b[0]);for(let i=1;i<leaves.length;i++)if(Math.hypot(leaves[i][0]-leaves[i-1][0],leaves[i][1]-leaves[i-1][1])<15)p.push([leaves[i-1],leaves[i]]);}
 return p;}
function scale(p,x,y,s){return p.map(line=>line.map(([a,b])=>[x+s*a/100,y+s*b/100]));}
export function generate(name,input={}){
 const p=validate({strands:name==="hex-braid"?6:3,...input});let paths;
 switch(name){
 case "tri-braid": paths=braid(p.strands,p.turns);break;
 case "hex-braid": paths=braid(p.strands,p.turns);break;
 case "golden-branch": paths=tree(p.depth,p.ratio,false);break;
 case "mycelium": paths=tree(p.depth,p.ratio,true);break;
 case "pocket-mesh": paths=square(p.cells);break;
 case "hex-mesh": paths=hex(p.cells);break;
 case "spiral":paths=[Array.from({length:361},(_,t)=>{const a=t*tau*p.turns/360,r=3+40*t/360;return [50+r*Math.cos(a),50+r*Math.sin(a)];})];break;
 case "fractal-braid":paths=[];{function grow(x,y,s,d){paths.push(...scale(braid(p.strands,p.turns),x,y,s));if(d>1){grow(x-s*.2,y+s,s*.5,d-1);grow(x+s*.7,y+s,s*.5,d-1);}}grow(35,5,30,Math.min(p.depth,3));}break;
 case "phi-hybrid":paths=[...scale(braid(p.strands,p.turns),0,0,50),...scale(square(p.cells),50,0,50),...scale(hex(p.cells),25,50,50)];break;
 default:throw new RangeError("unknown pattern");
 }
 let length=0;for(const line of paths)for(let i=1;i<line.length;i++)length+=Math.hypot(line[i][0]-line[i-1][0],line[i][1]-line[i-1][1])*p.size/100;
 const metrics={engine:"workbench-v0.2",pattern:name,parameters:p,path_count:paths.length,centerline_length_mm:Math.round(length*1000)/1000,crossings:"unspecified",geometry_only:true};
 return {paths,metrics};
}
export function toSvg(model){
 const {metrics:m,paths}=model;
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+m.parameters.size+'mm" height="'+m.parameters.size+'mm" viewBox="0 0 100 100"><title>'+m.pattern+' concept; crossings unspecified</title>'+paths.map(line=>'<polyline fill="none" stroke="#b87333" stroke-width="0.6" points="'+line.map(([x,y])=>x.toFixed(5)+','+y.toFixed(5)).join(' ')+'"/>').join('')+'</svg>';
}
export const applicable={
 "tri-braid":["size","strands","turns"],"hex-braid":["size","strands","turns"],"golden-branch":["size","depth","ratio"],mycelium:["size","depth","ratio"],"pocket-mesh":["size","cells"],"hex-mesh":["size","cells"],spiral:["size","turns"],"fractal-braid":["size","strands","turns","depth"],"phi-hybrid":["size","strands","turns","cells"]
};
