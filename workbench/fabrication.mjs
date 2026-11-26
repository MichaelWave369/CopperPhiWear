import {generate} from "./geometry.mjs";
import {analyzeProject} from "./garment.mjs";
import {importProject,exportProject} from "./hybrid.mjs";
// Physical print references, not sewing patterns or electrical wiring instructions.
export const PAPERS=Object.freeze({letter:Object.freeze([215.9,279.4]),a4:Object.freeze([210,297])});
const round=x=>Math.round(x*1000)/1000;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
export function fitsSheet(size,paper="letter"){
 if(!Object.hasOwn(PAPERS,paper))throw new RangeError("unsupported paper");
 if(!Number.isFinite(size)||size<=0)throw new RangeError("tile size");
 const [w,h]=PAPERS[paper];
 return size<=w-24&&size<=h-72;
}
export function swatchSheet(pattern,sizeMm,paper="letter"){
 const model=generate(pattern,{size:sizeMm});
 return renderSheet(pattern,model,model.metrics.parameters.size,paper);
}
function renderSheet(pattern,model,s,paper){
 if(!fitsSheet(s,paper))throw new RangeError("tile exceeds printable reference area; choose a smaller tile or larger supported sheet");
 const [w,h]=PAPERS[paper],top=29;
 const x=(w-s)/2,y=top;
 const paths=model.paths.map(line=>'<polyline fill="none" stroke="#8a4926" stroke-width="0.35" points="'+line.map(([a,b])=>round(x+a*s/100)+','+round(y+b*s/100)).join(' ')+'"/>').join("");
 const cy=h-28;
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'mm" height="'+h+'mm" viewBox="0 0 '+w+' '+h+'">'+
 '<rect width="'+w+'" height="'+h+'" fill="white"/><g fill="#222" font-family="sans-serif">'+
 '<text x="12" y="17" font-size="5">CopperPhiWear | '+esc(pattern)+'</text><text x="12" y="23" font-size="3.4">'+s+' × '+s+' mm concept tile; crossings unspecified</text>'+
 '<rect x="'+x+'" y="'+y+'" width="'+s+'" height="'+s+'" fill="none" stroke="#555" stroke-width=".25" stroke-dasharray="2 1"/>'+paths+
 '<text x="12" y="'+(cy-3)+'" font-size="3.4">Calibration: measure both axes before use</text>'+
 '<path d="M12 '+cy+'h50m-50 -2v4m50 -4v4M70 '+(cy-10)+'v20m-2 -20h4m-4 20h4" fill="none" stroke="#111" stroke-width=".35"/>'+
 '<text x="12" y="'+(cy+6)+'" font-size="3.3">50 mm horizontal</text><text x="75" y="'+(cy+1)+'" font-size="3.3">20 mm vertical</text>'+
 '<text x="12" y="'+(h-9)+'" font-size="3">Print actual size; disable fit-to-page. Detached swatch only.</text></g></svg>';
 return {svg,pattern,size_mm:s,paper,page_mm:[w,h],calibration_mm:[50,20],geometry:model.metrics};
}
export function checkCalibration(horizontal,vertical,tolerance=.01){
 for(const x of [horizontal,vertical])if(typeof x!=="number"||!Number.isFinite(x)||x<=0)throw new RangeError("positive measured lengths required");
 if(typeof tolerance!=="number"||!Number.isFinite(tolerance)||tolerance<0||tolerance>.05)throw new RangeError("tolerance");
 const x=horizontal/50-1,y=vertical/20-1;
 return {horizontal_error_fraction:x,vertical_error_fraction:y,tolerance,pass:Math.abs(x)<=tolerance+1e-12&&Math.abs(y)<=tolerance+1e-12};
}
export function fabricationPlan(project,paper="letter"){
 if(!Object.hasOwn(PAPERS,paper))throw new RangeError("paper");
 const report=analyzeProject(project),groups=new Map();
 for(const p of report.panels){
  if(!p.packing.tiles)continue;
  const size=p.geometry.parameters.size,key=p.pattern+"-"+size;
  let g=groups.get(key);if(!g){g={key,pattern:p.pattern,size_mm:size,quantity:0,panels:[],centerline_mm:0};groups.set(key,g);}
  g.quantity+=p.packing.tiles;g.panels.push(p.id);g.centerline_mm+=p.packing.total_centerline_mm;
 }
 const references=[...groups.values()].map(g=>{
  let printable=true,reason=null;try{swatchSheet(g.pattern,g.size_mm,paper);}catch(e){printable=false;reason=e.message;}
  return {...g,centerline_mm:round(g.centerline_mm),printable,reason};
 });
 const material=report.totals.material;
 return {version:1,paper,project:report.project,references,no_fit:report.no_fit,inventory:{tile_quantity:report.totals.tiles,installed_centerline_mm:round(report.totals.centerline_mm),purchase_yarn_m:material?material.procurement_length_m:null,installed_yarn_g:material?material.yarn_mass_g:null,installed_copper_g:material?material.copper_mass_g:null,substrate_quantity:null,thread_allowance_not_modeled:true},warnings:[...report.warnings,"Print references only; verify calibration in both axes.","Do not infer weaving order, electrical bonding, stitch allowances or sewing fit. Substrate, lining, attachment and finishing inventory requires manual measurement."]};
}
export function inventoryCsv(plan){
 const rows=[["pattern","tile_mm","quantity","centerline_mm","printable","panels"],...plan.references.map(g=>[g.pattern,g.size_mm,g.quantity,g.centerline_mm,g.printable,g.panels.join(";")])];
 return rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\r\n")+"\r\n";
}

// Hybrid reference uses the compiled tree exactly; never substitute a default motif.
export function hybridReference(project,paper="letter",quantity=1){
 if(!Number.isInteger(quantity)||quantity<1||quantity>99)throw new RangeError("quantity 1–99");
 const model=importProject(project),size=model.metrics.size_mm;
 const printable=fitsSheet(size,paper);
 return {version:1,kind:"hybrid-fabrication",project:exportProject(model),paper,quantity,size_mm:size,printable,
 reason:printable?null:"tile exceeds printable reference area; resize explicitly in ΦHybrid",
 geometry:model.metrics,inventory:{planned_centerline_mm:round(model.metrics.centerline_length_mm*quantity),actual_yarn_mass_g:null,substrate_quantity:null},
 warnings:["Detached swatch concept; no sewing or electrical connection instructions.","Length counts overlapping paths; actual yarn and finishing allowances are not measured.","Print actual size and verify both calibration bars; no physical validation."]};
}
export function hybridSheet(project,paper="letter"){
 const model=importProject(project);
 return renderSheet("Hybrid composition",model,model.metrics.size_mm,paper);
}
