import {checkCalibration} from "./fabrication.mjs";
export const checks=Object.freeze([
 {id:"composition",label:"Conductor composition and supplier documentation reviewed"},
 {id:"handling",label:"Handling and care instructions reviewed for detached experiment"},
 {id:"substrate",label:"Substrate lot and construction documented"},
 {id:"inspection",label:"Detached material inspection: loose, sharp or damaged fibers"},
 {id:"practice",label:"Nonconductive practice construction reviewed"},
 {id:"fixture",label:"Instrument, fixture and measurement method documented"},
 {id:"protocol",label:"Flex/abrasion protocol and checkpoints documented"}
]);
const fields=["supplier","product","lot","composition","substrate","substrateLot","care","documentRef"];
const quantities={copperMassFraction:[0,1],linearMassGPerM:[.000001,10000],linearResistanceOhmPerM:[.000001,1e8]};
const txt=(v,k,max=500)=>{if(typeof v!=="string"||v.length>max)throw new RangeError(k);return v.trim();};
export function blankMaterial(){return {version:1,format:"copperphiwear-material-review",material:Object.fromEntries(fields.map(k=>[k,""])),quantities:Object.fromEntries(Object.keys(quantities).map(k=>[k,{value:null,origin:"unknown",reference:""}])),checks:checks.map(c=>({id:c.id,status:"pending",note:""})),calibration:null};}
export function validateMaterial(input){
 if(!input||input.version!==1||input.format!=="copperphiwear-material-review"||!input.material||!input.quantities||!Array.isArray(input.checks)||input.checks.length!==checks.length)throw new RangeError("material review format");
 const material=Object.fromEntries(fields.map(k=>[k,txt(input.material[k],k)]));
 const q=Object.fromEntries(Object.entries(quantities).map(([k,[min,max]])=>{
  const r=input.quantities[k];if(!r||!["unknown","supplier","measured"].includes(r.origin))throw new RangeError(k+" origin");
  const reference=txt(r.reference,k+" reference");
  if(r.origin==="unknown"){if(r.value!==null||reference)throw new RangeError(k+" unknown must have no value or reference");}
  else if(typeof r.value!=="number"||!Number.isFinite(r.value)||r.value<min||r.value>max||!reference)throw new RangeError(k+" requires bounded value and source");
  return [k,{value:r.value,origin:r.origin,reference}];
 }));
 const map=new Map(input.checks.map(r=>[r?.id,r]));
 if(map.size!==checks.length)throw new RangeError("duplicate checklist ID");
 const rows=checks.map(c=>{const r=map.get(c.id);if(!r||!["pending","documented","issue"].includes(r.status))throw new RangeError("check status");const note=txt(r.note,"check note");if(r.status!=="pending"&&!note)throw new RangeError(c.id+" requires observation or document reference");return {id:c.id,status:r.status,note};});
 let calibration=null;if(input.calibration!==null){
  const c=input.calibration;if(!c||!txt(c.reference,"calibration reference"))throw new RangeError("calibration record");
  checkCalibration(c.horizontalMm,c.verticalMm);
  calibration={horizontalMm:c.horizontalMm,verticalMm:c.verticalMm,reference:txt(c.reference,"calibration reference")};
 }
 return {version:1,format:input.format,material,quantities:q,checks:rows,calibration};
}
export function reviewMaterial(input){
 const record=validateMaterial(input),missing=fields.filter(k=>!record.material[k]),unknown=Object.keys(quantities).filter(k=>record.quantities[k].origin==="unknown");
 const pending=record.checks.filter(c=>c.status==="pending").map(c=>c.id),issues=record.checks.filter(c=>c.status==="issue").map(c=>c.id);
 const calibration=record.calibration?checkCalibration(record.calibration.horizontalMm,record.calibration.verticalMm):null;
 const status=issues.length||calibration&&!calibration.pass?"issues-recorded":missing.length||unknown.length||pending.length||!calibration?"incomplete":"documentation-ready-for-independent-review";
 return {record,status,missing,unknown,pending,issues,calibration,authorized_for_wear:false,authorized_for_experiment:false,warnings:["Documented means user-reported evidence exists, not independently verified approval.","No software result authorizes fabrication, wear, electrical exposure or medical use.","Only detached swatches after independent material and procedure review. No personal health data."]};
}
