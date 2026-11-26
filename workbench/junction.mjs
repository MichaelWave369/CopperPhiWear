import {names,generate,validate} from "./geometry.mjs";
import {importProject,exportProject} from "./hybrid.mjs";
import {endpointGraph,equivalentResistance} from "./textile.mjs";
export const MAX_PATHS=300,MAX_POINTS=100000,MAX_BONDS=600;
const endpoint=(v,n)=>{if(!Number.isInteger(v)||v<0||v>=n)throw new RangeError("invalid endpoint");return v;};
export function sourceModel(source){
 if(!source||typeof source!=="object")throw new RangeError("source");
 let model,canonical,size;
 if(source.kind==="pattern"){
  if(!names.includes(source.pattern))throw new RangeError("pattern");
  const p=validate({strands:source.pattern==="hex-braid"?6:3,...source.parameters});
  model=generate(source.pattern,p);size=p.size;canonical={kind:"pattern",pattern:source.pattern,parameters:p};
 }else if(source.kind==="hybrid"){
  model=importProject(source.project);size=model.metrics.size_mm;canonical={kind:"hybrid",project:exportProject(model)};
 }else throw new RangeError("source kind");
 if(model.paths.length>MAX_PATHS||model.paths.reduce((n,p)=>n+p.length,0)>MAX_POINTS)throw new RangeError("junction editor geometry budget");
 const endpoints=model.paths.flatMap((p,i)=>[{id:i*2,path:i,side:"start",point:p[0]},{id:i*2+1,path:i,side:"end",point:p.at(-1)}]);
 return {source:canonical,size,paths:model.paths,endpoints};
}
export function createJunction(source){
 const m=sourceModel(source);return {version:1,format:"copperphiwear-junction",source:m.source,bonds:[],ohmPerM:null,terminals:[0,1]};
}
export function validateJunction(p){
 if(!p||p.version!==1||p.format!=="copperphiwear-junction")throw new RangeError("junction format");
 const m=sourceModel(p.source),n=m.endpoints.length,seen=new Set();
 if(!Array.isArray(p.bonds)||p.bonds.length>MAX_BONDS)throw new RangeError("bond count");
 const bonds=p.bonds.map(b=>{
  if(!Array.isArray(b)||b.length!==2)throw new RangeError("bond pair");
  const [a,c]=b.map(v=>endpoint(v,n)).sort((x,y)=>x-y),key=a+":"+c;
  if(a===c||seen.has(key))throw new RangeError("duplicate or self bond");
  // Ideal bonds only between coincident endpoints; no invisible jumper conductors.
  const x=m.endpoints[a].point,y=m.endpoints[c].point;
  if(Math.hypot(x[0]-y[0],x[1]-y[1])>1e-6)throw new RangeError("endpoints must coincide; no implicit jumper");
  seen.add(key);return [a,c];
 }).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 if(!Array.isArray(p.terminals)||p.terminals.length!==2)throw new RangeError("terminals");
 const terminals=p.terminals.map(v=>endpoint(v,n));
 if(terminals[0]===terminals[1])throw new RangeError("select distinct terminals");
 if(p.ohmPerM!==null&&(typeof p.ohmPerM!=="number"||!Number.isFinite(p.ohmPerM)||p.ohmPerM<.000001||p.ohmPerM>1e8))throw new RangeError("documented resistance per metre");
 return {version:1,format:"copperphiwear-junction",source:m.source,bonds,ohmPerM:p.ohmPerM,terminals};
}
export function addBond(p,a,b){return validateJunction({...p,bonds:[...p.bonds,[a,b]]});}
export function removeBond(p,index){const c=validateJunction(p);if(!Number.isInteger(index)||index<0||index>=c.bonds.length)throw new RangeError("bond index");return validateJunction({...c,bonds:c.bonds.filter((_,i)=>i!==index)});}
export function analyzeJunction(input){
 const project=validateJunction(input),m=sourceModel(project.source),g=endpointGraph(m.paths,project.bonds,m.size,project.ohmPerM??1);
 const adj=new Map(g.vertices.map(v=>[v,[]]));
 for(const e of g.edges){adj.get(e.a).push(e.b);adj.get(e.b).push(e.a);}
 const membership=new Map();let count=0;
 for(const v of g.vertices){if(membership.has(v))continue;const stack=[v];membership.set(v,count);while(stack.length){for(const u of adj.get(stack.pop()))if(!membership.has(u)){membership.set(u,count);stack.push(u);}}count++;}
 const [a,b]=project.terminals,connected=membership.get(g.endpointToNode[a])===membership.get(g.endpointToNode[b]);
 let resistance=null,resistanceStatus=connected?"material value required":"disconnected";
 if(connected&&project.ohmPerM!==null){try{resistance=equivalentResistance(g,a,b);resistanceStatus="ideal model";}catch(e){resistanceStatus="solver unavailable: "+e.message;}}
 return {project,paths:m.paths,endpoints:m.endpoints,metrics:{size_mm:m.size,paths:m.paths.length,bonds:project.bonds.length,components:g.components,cycle_rank:g.cycle_rank,connected,ideal_resistance_ohm:resistance,resistance_status:resistanceStatus},pathComponents:g.edges.map(e=>membership.get(e.a)),warnings:["Only explicit coincident endpoint bonds are modeled; no inferred intersections or jumpers.","Ideal DC resistance excludes contact resistance; no RF, body, powered or protective garment model.","Detached swatches only; never connect a meter or power source to worn clothing."]};
}
