import {names,generate,applicable} from "./geometry.mjs";
// Geometry proxies only. No RF, mechanical, electrical or health performance predictions.
const round=x=>Math.round(x*1e6)/1e6;
export function occupancy(paths,resolution=30){
 if(!Number.isInteger(resolution)||resolution<10||resolution>60)throw new RangeError("grid resolution");
 const occupied=new Set();
 const mark=(x,y)=>occupied.add(Math.min(resolution-1,Math.max(0,Math.floor(x*resolution/100)))+resolution*Math.min(resolution-1,Math.max(0,Math.floor(y*resolution/100))));
 for(const line of paths)for(let i=1;i<line.length;i++){
 const [x,y]=line[i-1],[u,v]=line[i],n=Math.max(1,Math.ceil(Math.hypot(u-x,v-y)*resolution/25));
 for(let j=0;j<=n;j++)mark(x+(u-x)*j/n,y+(v-y)*j/n);
 }
 return occupied.size/(resolution*resolution);
}
export function evaluateCandidate(pattern,parameters,resolution=30){
 const m=generate(pattern,parameters);
 return {pattern,parameters:m.metrics.parameters,length_mm:m.metrics.centerline_length_mm,path_count:m.metrics.path_count,occupied_fraction:round(occupancy(m.paths,resolution)),grid_resolution:resolution};
}
const choices={strands:[3,6,9],turns:[1,3,6],depth:[1,2,3,4,5],ratio:[.4,.5,.618,.7],cells:[1,2,3,4,6]};
export function candidates({patterns=names,size=100,resolution=30}={}){
 if(!Array.isArray(patterns)||!patterns.length||patterns.length>names.length||new Set(patterns).size!==patterns.length||patterns.some(n=>!names.includes(n)))throw new RangeError("pattern selection");
 if(!Number.isInteger(size)||size<10||size>1000)throw new RangeError("tile size");
 if(!Number.isInteger(resolution)||resolution<10||resolution>60)throw new RangeError("grid resolution");
 const out=[];
 for(const pattern of patterns){
 const keys=applicable[pattern].filter(k=>k!=="size");
 function visit(i,p){
 if(i===keys.length){out.push(evaluateCandidate(pattern,{size,...p},resolution));return;}
 const k=keys[i],values=k==="depth"&&pattern==="fractal-braid"?[1,2,3]:choices[k];
 for(const v of values)visit(i+1,{...p,[k]:v});
 }
 visit(0,{});
 }
 return out;
}
export function dominates(a,b){
 return a.length_mm<=b.length_mm&&a.path_count<=b.path_count&&a.occupied_fraction>=b.occupied_fraction&&(a.length_mm<b.length_mm||a.path_count<b.path_count||a.occupied_fraction>b.occupied_fraction);
}
export function pareto(rows){return rows.filter((a,i)=>!rows.some((b,j)=>i!==j&&dominates(b,a)));}
export function optimize({patterns=names,size=100,resolution=30,maxLengthMm=null,maxPaths=null,minOccupancy=0}={}){
 for(const [k,v,min,max] of [["maxLengthMm",maxLengthMm,0,1e8],["maxPaths",maxPaths,1,1000],["minOccupancy",minOccupancy,0,1]]){
 if(v===null&&k!=="minOccupancy")continue;
 if(typeof v!=="number"||!Number.isFinite(v)||v<min||v>max||(k==="maxPaths"&&!Number.isInteger(v)))throw new RangeError(k);
 }
 const all=candidates({patterns,size,resolution});
 const feasible=all.filter(c=>(maxLengthMm===null||c.length_mm<=maxLengthMm)&&(maxPaths===null||c.path_count<=maxPaths)&&c.occupied_fraction>=minOccupancy);
 const front=pareto(feasible).sort((a,b)=>a.length_mm-b.length_mm||a.path_count-b.path_count||b.occupied_fraction-a.occupied_fraction||a.pattern.localeCompare(b.pattern));
 return {version:1,settings:{patterns:[...patterns],size,resolution,maxLengthMm,maxPaths,minOccupancy},candidate_count:all.length,feasible_count:feasible.length,front,feasible,warnings:["Finite parameter-grid search; not a global optimum.","Grid occupancy is a sampled centerline spatial-distribution proxy, not metal area, shielding, comfort or coverage certification.","Path count is a geometric proxy, not actual stitch count or fabrication difficulty.","Durability requires matched physical swatch measurements and is not scored here.","Equal-objective candidates retained; no weighted winner or medical claim."]};
}
export function optimizeCsv(report){
 const keys=["pattern","length_mm","path_count","occupied_fraction","grid_resolution","parameters"];
 return [keys,...report.front.map(r=>keys.map(k=>k==="parameters"?JSON.stringify(r[k]):r[k]))].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n")+"\r\n";
}
