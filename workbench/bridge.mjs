import {validateVault,MAX_CHARS} from "./vault.mjs";
import {fabricationPlan,hybridReference} from "./fabrication.mjs";
import {summarizeLab} from "./laboratory.mjs";
const text=(v,k,max)=>{if(typeof v!=="string"||!v.trim()||v.length>max)throw new RangeError(k);return v.trim();};
export const relationKinds=Object.freeze(["design-context","measurement-context"]);
const bounded=v=>{const s=JSON.stringify(v);if(typeof s!=="string"||s.length>MAX_CHARS)throw new RangeError("project size limit");};
export function validateBridge(input){
 bounded(input);
 if(!input||input.format!=="copperphiwear-project"||input.version!==1||!Array.isArray(input.links)||input.links.length>300)throw new RangeError("project format");
 const name=text(input.name,"project name",100),notes=typeof input.notes==="string"&&input.notes.length<=2000?input.notes:(()=>{throw new RangeError("notes");})();
 if(!["letter","a4"].includes(input.paper))throw new RangeError("paper");
 const records=validateVault({version:1,records:input.records}).records,byId=new Map(records.map(r=>[r.id,r])),seen=new Set();
 const links=input.links.map(l=>{
  if(!l||!relationKinds.includes(l.kind)||!byId.has(l.from)||!byId.has(l.to)||l.from===l.to)throw new RangeError("invalid or dangling relation");
  const a=byId.get(l.from),b=byId.get(l.to);
  if(l.kind==="design-context"&&(a.kind!=="hybrid"||b.kind!=="garment"))throw new RangeError("design context requires hybrid → garment");
  if(l.kind==="measurement-context"&&(!["garment","hybrid"].includes(a.kind)||b.kind!=="laboratory"))throw new RangeError("measurement context requires design → laboratory");
  const key=JSON.stringify([l.kind,l.from,l.to]);if(seen.has(key))throw new RangeError("duplicate relation");seen.add(key);
  return {kind:l.kind,from:l.from,to:l.to,note:text(l.note,"relation rationale",500)};
 });
 const project={format:"copperphiwear-project",version:1,name,notes,paper:input.paper,records,links};bounded(project);return project;
}
export function createBridge({name,notes="",paper="letter",records=[],links=[]}){
 return validateBridge({format:"copperphiwear-project",version:1,name,notes,paper,records,links});
}
export function addLink(project,link){return validateBridge({...validateBridge(project),links:[...project.links,link]});}
export function removeRecord(project,id){
 const p=validateBridge(project);if(!p.records.some(r=>r.id===id))throw new RangeError("unknown record");
 if(p.links.some(l=>l.from===id||l.to===id))throw new RangeError("remove associated relations before removing snapshot");
 return validateBridge({...p,records:p.records.filter(r=>r.id!==id)});
}
export function analyzeBridge(input){
 const p=validateBridge(input);
 return {format:"copperphiwear-project-report",version:1,name:p.name,paper:p.paper,records:p.records.map(r=>{
  if(r.kind==="garment"){const f=fabricationPlan(r.data,p.paper);return {id:r.id,kind:r.kind,name:r.name,derived:{inventory:f.inventory,no_fit:f.no_fit,references:f.references}};}
  if(r.kind==="hybrid"){const f=hybridReference(r.data,p.paper);return {id:r.id,kind:r.kind,name:r.name,derived:{...f.geometry,fabrication:{printable:f.printable,reason:f.reason,paper:f.paper,inventory:f.inventory}}};}
  const l=summarizeLab(r.data);return {id:r.id,kind:r.kind,name:r.name,derived:{registered_samples:l.sample_count,recorded_readings:l.reading_count,groups:l.groups}};
 }),links:p.links,warnings:["Links are user-declared context, not provenance proof, fabrication confirmation or matched experimental evidence.","Derived reports recompute from captured source snapshots; no cross-record aggregation or deduplication of physical specimens.","Hybrid references are supported; hybrid compositions are not yet garment panel inputs.","Registered samples may be planned; readings are user-entered and not independently verified.","No medical, shielding or wearable validation."]};
}
