import {designs,blankLab,appendSample} from "./laboratory.mjs";
import {generate} from "./geometry.mjs";
import {swatchSheet} from "./fabrication.mjs";
export const pilotDesigns=Object.freeze(["plain-control","straight-reference","tri-braid"]);
export const checklist=Object.freeze([
"Document supplier composition, skin-contact suitability and care; inspect for sharp or loose fibers.",
"Use nonconductive practice material first; prepare detached samples only.",
"Print at actual size and verify horizontal and vertical calibration bars.",
"Match substrate lot, dimensions and test method; document differences in conductor length and mass.",
"Document electrical terminals and all actual crossing connections before measuring.",
"Record instrument, uncertainty, probe placement, environment and baseline.",
"Define flex radius, cycle counts and abrasion method before collecting results.",
"Retain open circuits, failures, damage and missing readings; inspect before reuse.",
"Review all physical results and garment material/fit risks independently before any wearable trial."
]);
const text=(v,k)=>{if(typeof v!=="string"||!v.trim()||v.length>160)throw new RangeError(k);return v.trim();};
function shuffle(items,seed){const a=[...items];let x=seed>>>0;for(let i=a.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createStudy({scope="pilot",replicates=3,size=100,seed=369,paper="letter",lot,substrate}={}){
 if(!["pilot","full"].includes(scope))throw new RangeError("scope");
 if(!Number.isInteger(replicates)||replicates<3||replicates>9)throw new RangeError("replicates 3–9");
 if(!Number.isInteger(size)||size<10||size>180)throw new RangeError("tile size 10–180 mm");
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw new RangeError("seed");
 if(!["letter","a4"].includes(paper))throw new RangeError("paper");
 lot=text(lot,"documented material lot");substrate=text(substrate,"documented substrate");
 const selected=scope==="pilot"?pilotDesigns:designs;
 const specimens=[],references=[];let lab=blankLab();
 for(const [i,design] of selected.entries()){
  const control=design==="plain-control"||design==="straight-reference";
  const plannedLength=design==="plain-control"?0:design==="straight-reference"?size*.8:generate(design,{size}).metrics.centerline_length_mm;
  if(!control)references.push({design,size_mm:size,paper,filename:design+"-"+size+".svg"});
  for(let j=1;j<=replicates;j++){
   const id="CW-"+String(i+1).padStart(2,"0")+"-"+String(j).padStart(2,"0");
   specimens.push({id,design,planned_centerline_mm:plannedLength,actual_length_mm:null,actual_mass_g:null});
   lab=appendSample(lab,{id,design,lot:design==="plain-control"?"none (plain control)":lot,substrate,widthMm:size,heightMm:size,conductorLengthMm:design==="plain-control"?0:null,conductorMassG:design==="plain-control"?0:null,notes:"Planned specimen; confirm actual construction and metadata before any measurement."});
  }
 }
 return {version:1,settings:{scope,replicates,size,seed,paper,lot,substrate},specimens,measurement_order:shuffle(specimens.map(s=>s.id),seed),references,lab_seed:lab,checklist:[...checklist],controls:{plain:"Same substrate, no conductive yarn; no assumed numeric resistance.",straight:"Centered straight line from 10% to 90% of tile width; record actual length. Not length-matched to complex motifs."},limitations:["Planned specimens are not fabricated; do not count as completed experiments.","Default geometries only, not hybrid composition trees.","Lengths are design estimates; actual sample length/mass must be documented separately.","No matching of conductor length or mass is guaranteed; no causal geometry inference.","No health, PPE, RF or powered garment claims. Detached experiments only."]};
}
export function studyReference(study,design){
 const entry=study.references.find(r=>r.design===design);if(!entry)throw new RangeError("reference unavailable");
 return swatchSheet(entry.design,entry.size_mm,entry.paper).svg;
}
export function studyCsv(study){
 const rows=[["order","sample_id","design","planned_centerline_mm","actual_length_mm","actual_mass_g"],...study.measurement_order.map((id,i)=>{const s=study.specimens.find(v=>v.id===id);return [i+1,id,s.design,s.planned_centerline_mm,"",""];})];
 return rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n")+"\r\n";
}
