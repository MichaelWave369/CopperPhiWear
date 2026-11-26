import {names,generate,validate} from "./geometry.mjs";
import {occupancy} from "./optimize.mjs";
// Finite recursive composition of geometric centerlines, not electrical connections.
export const limits=Object.freeze({depth:6,nodes:256,paths:6000,points:500000,children:12});
const num=(x,k,lo,hi)=>{if(typeof x!=="number"||!Number.isFinite(x)||x<lo||x>hi)throw new RangeError(k);return x;};
const round=x=>Math.round(x*1e6)/1e6;
const identity={x:50,y:50,scale:1,rotation:0};
const motif=(pattern,x=50,y=50,scale=1,rotation=0,parameters={})=>({type:"motif",pattern,transform:{x,y,scale,rotation},parameters});
const group=(children,x=50,y=50,scale=1,rotation=0)=>({type:"group",transform:{x,y,scale,rotation},children});
export function preset(name,depth=2){
 if(!Number.isInteger(depth)||depth<1||depth>4)throw new RangeError("preset depth");
 if(name==="pocket-recursion"){
  function build(d){return group([motif("pocket-mesh",50,50,.94,0,{cells:1}),...(d>1?[{...build(d-1),transform:{x:50,y:50,scale:.36,rotation:90}}]:[motif("spiral",50,50,.30)])]);}
  return build(depth);
 }
 if(name==="golden-mycelium"){
  function build(d){return group([motif("golden-branch",50,50,.88,0,{depth:3,ratio:.618}),...(d>1?[{...build(d-1),transform:{x:28,y:25,scale:.31,rotation:-30}},{...build(d-1),transform:{x:72,y:25,scale:.31,rotation:30}}]:[])]);}
  return build(depth);
 }
 if(name==="braid-369")return group([motif("tri-braid",20,50,.34,0,{strands:3,turns:3}),motif("hex-braid",50,50,.34,0,{strands:6,turns:3}),motif("tri-braid",80,50,.34,0,{strands:9,turns:3})]);
 if(name==="phi-mosaic"){
  function build(d){return group([motif("pocket-mesh",50,50,.38,0,{cells:1}),...(d>1?[[25,25,0],[75,25,90],[25,75,180],[75,75,270]].map(([x,y,r])=>({...build(d-1),transform:{x,y,scale:.40,rotation:r}})):[motif("hex-mesh",24,24,.30,0,{cells:2}),motif("spiral",76,76,.30)])]);}
  // Full four-way recursion at depth 4 exceeds the node budget; expose three levels.
  if(depth>3)throw new RangeError("mosaic depth limited to 3");
  return build(depth);
 }
 throw new RangeError("preset");
}
export const presets=Object.freeze(["pocket-recursion","golden-mycelium","braid-369","phi-mosaic"]);
function readTransform(t){
 if(t===undefined)t=identity;
 if(!t||typeof t!=="object"||Array.isArray(t))throw new RangeError("transform");
 return {x:num(t.x,"x",0,100),y:num(t.y,"y",0,100),scale:num(t.scale,"scale",.01,1),rotation:num(t.rotation,"rotation",-360,360)};
}
function transformPoint([x,y],t){
 const a=t.rotation*Math.PI/180,u=(x-50)*t.scale,v=(y-50)*t.scale;
 return [t.x+u*Math.cos(a)-v*Math.sin(a),t.y+u*Math.sin(a)+v*Math.cos(a)];
}
export function compile(tree,{size=100,resolution=30}={}){
 if(!Number.isInteger(size)||size<10||size>1000)throw new RangeError("tile size");
 if(!Number.isInteger(resolution)||resolution<10||resolution>60)throw new RangeError("grid resolution");
 const paths=[],active=new Set();let nodes=0,points=0,maxDepth=0,motifs=0;
 function walk(n,ancestors,depth){
  if(!n||typeof n!=="object"||Array.isArray(n)||active.has(n))throw new RangeError("invalid or cyclic node");
  if(depth>limits.depth||++nodes>limits.nodes)throw new RangeError("composition node/depth budget");
  maxDepth=Math.max(maxDepth,depth);active.add(n);
  const t=readTransform(n.transform),chain=[t,...ancestors];
  let clean;
  if(n.type==="group"){
   if(!Array.isArray(n.children)||!n.children.length||n.children.length>limits.children)throw new RangeError("group children");
   clean={type:"group",transform:t,children:n.children.map(c=>walk(c,chain,depth+1))};
  }else if(n.type==="motif"){
   if(!names.includes(n.pattern))throw new RangeError("motif");
   if(n.parameters!==undefined&&(!n.parameters||typeof n.parameters!=="object"||Array.isArray(n.parameters)))throw new RangeError("parameters");
   const raw=n.parameters??{};
   if(Object.keys(raw).some(k=>!["strands","turns","depth","ratio","cells"].includes(k)))throw new RangeError("unknown motif parameter");
   const p=validate({strands:n.pattern==="hex-braid"?6:3,...raw,size:100});
   const model=generate(n.pattern,p);
   motifs++;
   for(const line of model.paths){
    if(paths.length>=limits.paths||points+line.length>limits.points)throw new RangeError("path/point budget");
    const transformed=line.map(pt=>{
     for(const step of chain)pt=transformPoint(pt,step);
     if(pt.some(v=>!Number.isFinite(v)||v< -1e-8||v>100+1e-8))throw new RangeError("motif outside tile");
     return pt.map(v=>Math.max(0,Math.min(100,v)));
    });
    paths.push(transformed);points+=line.length;
   }
   const {size:_,...parameters}=p;clean={type:"motif",pattern:n.pattern,transform:t,parameters};
  }else throw new RangeError("node type");
  active.delete(n);return clean;
 }
 const canonical=walk(tree,[],1);
 let len=0;for(const p of paths)for(let i=1;i<p.length;i++)len+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1])*size/100;
 return {tree:canonical,paths,metrics:{engine:"hybrid-v0.8",size_mm:size,grid_resolution:resolution,node_count:nodes,motif_count:motifs,depth:maxDepth,path_count:paths.length,point_count:points,centerline_length_mm:round(len),occupied_fraction:round(occupancy(paths,resolution)),crossings:"unspecified",geometry_only:true}};
}
export function hybridSvg(model){
 const s=model.metrics.size_mm;
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+s+'mm" height="'+s+'mm" viewBox="0 0 100 100"><title>PhiHybrid composition; crossings unspecified</title>'+model.paths.map(line=>'<polyline fill="none" stroke="#b87333" stroke-width=".35" points="'+line.map(([x,y])=>x.toFixed(5)+','+y.toFixed(5)).join(" ")+'"/>').join("")+'</svg>';
}
export function exportProject(model){return {version:1,size:model.metrics.size_mm,resolution:model.metrics.grid_resolution,tree:model.tree};}
export function importProject(project){
 if(!project||project.version!==1||project.size===undefined||project.resolution===undefined)throw new RangeError("hybrid project version");
 return compile(project.tree,{size:project.size,resolution:project.resolution});
}
