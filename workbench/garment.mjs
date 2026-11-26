import {names,generate} from "./geometry.mjs";
import {estimateMaterial,panelPlan} from "./textile.mjs";
// Detached panel planning; never creates connections across panels.
export const zones=Object.freeze([
 {id:"front-left",label:"Left front",pattern:"pocket-mesh"},
 {id:"front-right",label:"Right front",pattern:"pocket-mesh"},
 {id:"back-left",label:"Left back",pattern:"mycelium"},
 {id:"back-right",label:"Right back",pattern:"mycelium"},
 {id:"left-sleeve",label:"Left sleeve",pattern:"tri-braid"},
 {id:"right-sleeve",label:"Right sleeve",pattern:"tri-braid"},
 {id:"left-shoulder",label:"Left shoulder",pattern:"hex-mesh"},
 {id:"right-shoulder",label:"Right shoulder",pattern:"hex-mesh"},
 {id:"back-center",label:"Back center",pattern:"fractal-braid"}
].map(Object.freeze));
export function blankProject(){
 return {version:1,material:{linearMassGPerM:null,linearResistanceOhmPerM:null,copperMassFraction:null,wasteFraction:.1},panels:zones.map(z=>({id:z.id,enabled:false,pattern:z.pattern,widthMm:null,heightMm:null,tileMm:100,gapMm:5,marginMm:10}))};
}
const number=(x,name,min,max)=>{if(typeof x!=="number"||!Number.isFinite(x)||x<min||x>max)throw new RangeError(name);return x;};
export function validateProject(project){
 if(!project||project.version!==1||!Array.isArray(project.panels)||project.panels.length!==zones.length)throw new RangeError("project format");
 const m=project.material;if(!m||typeof m!=="object")throw new RangeError("material");
 const material={};
 for(const [k,min,max] of [["linearMassGPerM",.000001,10000],["linearResistanceOhmPerM",.000001,1e8],["copperMassFraction",0,1],["wasteFraction",0,1]]){
  material[k]=m[k]===null&&k!=="wasteFraction"?null:number(m[k],k,min,max);
 }
 const seen=new Set();
 const panels=project.panels.map(p=>{
  if(!p||!zones.some(z=>z.id===p.id)||seen.has(p.id)||typeof p.enabled!=="boolean"||!names.includes(p.pattern))throw new RangeError("panel identity or pattern");
  seen.add(p.id);
  const q={id:p.id,enabled:p.enabled,pattern:p.pattern};
  for(const k of ["widthMm","heightMm"])q[k]=p[k]===null&&!p.enabled?null:number(p[k],k,1,3000);
  q.tileMm=number(p.tileMm,"tile",10,1000);if(!Number.isInteger(q.tileMm))throw new RangeError("tile must be integer");
  q.gapMm=number(p.gapMm,"gap",0,500);q.marginMm=number(p.marginMm,"margin",0,500);
  return q;
 });
 return {version:1,material,panels};
}
export function analyzeProject(input){
 const project=validateProject(input),m=project.material;
 const hasMaterial=["linearMassGPerM","linearResistanceOhmPerM","copperMassFraction"].every(k=>m[k]!==null);
 const panels=project.panels.filter(p=>p.enabled).map(p=>{
  const geo=generate(p.pattern,{size:p.tileMm});
  const packing=panelPlan({...p,tileLengthMm:geo.metrics.centerline_length_mm});
  return {id:p.id,pattern:p.pattern,geometry:geo.metrics,packing,material:hasMaterial?estimateMaterial(packing.total_centerline_mm,m):null};
 });
 const tiles=panels.reduce((a,p)=>a+p.packing.tiles,0),length=panels.reduce((a,p)=>a+p.packing.total_centerline_mm,0);
 const noFit=panels.filter(p=>p.packing.tiles===0).map(p=>p.id);
 return {version:1,project,panels,totals:{active_panels:panels.length,tiles,centerline_mm:length,material:hasMaterial?{...estimateMaterial(length,m),straight_reference_ohm:undefined,warning:"Aggregate purchasing estimate only; no combined garment resistance."}:null},no_fit:noFit,warnings:["Rectangular swatch estimates only; manually verify non-overlapping regions, seams, fit and ventilation.","All panels independent. Hood, neck and cuffs excluded. No electrical connections between panels.","No power, grounding, on-body electrical tests, RF, PPE or medical claims.","Material values must be measured or supplied; no actual textile validated."]};
}
