// Off-body planning only. No body, power, grounding, RF or clinical model.
const finite=(x,label,min=0,max=1e9)=>{if(typeof x!=="number"||!Number.isFinite(x)||x<min||x>max)throw new RangeError(label);return x;};
const integer=(x,label,min,max)=>{finite(x,label,min,max);if(!Number.isInteger(x))throw new RangeError(label);return x;};
export function estimateMaterial(lengthMm,{linearMassGPerM,linearResistanceOhmPerM,copperMassFraction,wasteFraction=0.1}={}){
 const lengthM=finite(lengthMm,"length mm",0,1e8)/1000;
 const massRate=finite(linearMassGPerM,"measured/supplier mass g/m",0.000001,10000);
 const resistanceRate=finite(linearResistanceOhmPerM,"measured/supplier ohm/m",0.000001,1e8);
 const copper=finite(copperMassFraction,"copper mass fraction",0,1);
 const waste=finite(wasteFraction,"waste fraction",0,1);
 return {length_m:lengthM,procurement_length_m:lengthM*(1+waste),yarn_mass_g:lengthM*massRate,copper_mass_g:lengthM*massRate*copper,straight_reference_ohm:lengthM*resistanceRate,linear_resistance_ohm_per_m:resistanceRate,warning:"Straight reference only; not garment or network resistance. Supplier or measured values required."};
}
export function panelPlan({widthMm,heightMm,tileMm,gapMm=5,marginMm=10,quantity=1,tileLengthMm}){
 const w=finite(widthMm,"panel width",1,3000),h=finite(heightMm,"panel height",1,3000);
 const t=finite(tileMm,"tile",10,1000),g=finite(gapMm,"gap",0,500),m=finite(marginMm,"margin",0,500);
 integer(quantity,"quantity",1,100);finite(tileLengthMm,"tile length",0,1e7);
 const cols=Math.max(0,Math.floor((w-2*m+g)/(t+g))),rows=Math.max(0,Math.floor((h-2*m+g)/(t+g)));
 const tiles=cols*rows*quantity;
 return {columns:cols,rows,quantity,tiles,total_centerline_mm:tiles*tileLengthMm,warning:"Rectangular planning estimate only; no garment fit, seam or electrical interconnection model."};
}
// Every geometric path has two endpoint nodes. Interior crossings never imply contact.
// Explicit ideal endpoint bonds only. No inference from coincident coordinates.
export function endpointGraph(paths,bonds=[],scaleMm=100,ohmPerM=1){
 if(!Array.isArray(paths)||paths.length<1||paths.length>1000)throw new RangeError("paths");
 finite(scaleMm,"scale",10,1000);finite(ohmPerM,"linear resistance",0.000001,1e8);
 if(!Array.isArray(bonds)||bonds.length>2000)throw new RangeError("bonds");
 const nodes=paths.length*2,parent=Array.from({length:nodes},(_,i)=>i);
 function root(i){while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;}
 const edges=paths.map((line,i)=>{
  if(!Array.isArray(line)||line.length<2||line.length>10000)throw new RangeError("line");
  for(const p of line){if(!Array.isArray(p)||p.length!==2)throw new RangeError("point");p.forEach(v=>finite(v,"coordinate",0,100));}
  let len=0;for(let j=1;j<line.length;j++)len+=Math.hypot(line[j][0]-line[j-1][0],line[j][1]-line[j-1][1])*scaleMm/100/1000;
  if(len<=0)throw new RangeError("zero-length conductor");
  return {a:2*i,b:2*i+1,length_m:len,ohm:len*ohmPerM};
 });
 for(const bond of bonds){if(!Array.isArray(bond)||bond.length!==2)throw new RangeError("bond");const [a,b]=bond.map(i=>integer(i,"endpoint",0,nodes-1));parent[root(a)]=root(b);}
 const endpointToNode=parent.map((_,i)=>root(i));
 const collapsed=edges.map(e=>({...e,a:root(e.a),b:root(e.b)}));
 const vertices=[...new Set(endpointToNode)].sort((a,b)=>a-b);
 const adj=new Map(vertices.map(v=>[v,new Set()]));
 for(const e of collapsed){adj.get(e.a).add(e.b);adj.get(e.b).add(e.a);}
 const seen=new Set();let components=0;
 for(const v of vertices){if(seen.has(v))continue;components++;const stack=[v];seen.add(v);while(stack.length){for(const u of adj.get(stack.pop()))if(!seen.has(u)){seen.add(u);stack.push(u);}}}
 return {endpointToNode,vertices,edges:collapsed,components,cycle_rank:collapsed.length-vertices.length+components,crossings:"not inferred",bond_model:"ideal endpoint bonds; contact resistance omitted"};
}
// Equivalent DC resistance via reduced nodal conductance matrix, unit current.
// Only for detached ideal passive resistor networks. Null means disconnected.
export function equivalentResistance(graph,sourceEndpoint,sinkEndpoint){
 const map=graph.endpointToNode;
 const s=map[integer(sourceEndpoint,"source",0,map.length-1)],t=map[integer(sinkEndpoint,"sink",0,map.length-1)];
 if(s===t)return 0;
 const reachable=new Set([s]),queue=[s],adj=new Map(graph.vertices.map(v=>[v,[]]));
 for(const e of graph.edges){adj.get(e.a).push(e.b);adj.get(e.b).push(e.a);}
 for(let i=0;i<queue.length;i++)for(const u of adj.get(queue[i]))if(!reachable.has(u)){reachable.add(u);queue.push(u);}
 if(!reachable.has(t))return null;
 if(reachable.size>150)throw new RangeError("solver limited to 150 connected nodes");
 const ids=[...reachable].filter(v=>v!==t),idx=new Map(ids.map((v,i)=>[v,i])),n=ids.length;
 const a=Array.from({length:n},()=>Array(n+1).fill(0));a[idx.get(s)][n]=1;
 for(const e of graph.edges){if(e.a===e.b||!reachable.has(e.a))continue;const i=idx.get(e.a),j=idx.get(e.b),g=1/e.ohm;
  if(i!==undefined)a[i][i]+=g;if(j!==undefined)a[j][j]+=g;
  if(i!==undefined&&j!==undefined){a[i][j]-=g;a[j][i]-=g;}
 }
 for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[p][k]))p=i;
  if(!Number.isFinite(a[p][k])||a[p][k]===0)throw new Error("singular network");
  [a[k],a[p]]=[a[p],a[k]];const v=a[k][k];for(let j=k;j<=n;j++)a[k][j]/=v;
  for(let i=0;i<n;i++)if(i!==k){const f=a[i][k];for(let j=k;j<=n;j++)a[i][j]-=f*a[k][j];}
 }
 const result=a[idx.get(s)][n];if(!Number.isFinite(result)||result<0)throw new Error("numerical failure");return result;
}
