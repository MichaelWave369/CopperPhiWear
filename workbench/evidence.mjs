import {validateLab,designs,describe} from "./laboratory.mjs";
// Descriptive matched comparisons; no causal or health inference.
export function compareEvidence(input,settings){
 const lab=validateLab(input),s=settings;
 if(!s||!designs.includes(s.candidate)||!designs.includes(s.reference)||s.candidate===s.reference||!["flex","abrasion"].includes(s.stage)||!Number.isInteger(s.cycles)||s.cycles<1||s.cycles>1e8||!["mass","length"].includes(s.matchBy)||typeof s.method!=="string"||!s.method.trim()||s.method.length>200)throw new RangeError("comparison settings");
 const method=s.method.trim(),key=s.matchBy==="mass"?"conductorMassG":"conductorLengthMm";
 // Fixed exploratory tolerances, reported explicitly.
 const tolerances={relative_material:.05,dimension_mm:1,temperature_c:2,humidity_pct:5};
 const readings=new Map(lab.samples.map(x=>[x.id,[]]));for(const r of lab.readings)readings.get(r.sampleId).push(r);
 const specimens=lab.samples.filter(x=>[s.candidate,s.reference].includes(x.design)).map(x=>{
  const selected=readings.get(x.id).filter(r=>r.method===method&&(r.stage==="baseline"||r.stage===s.stage&&r.cycles===s.cycles));
  const baseline=selected.filter(r=>r.stage==="baseline"),post=selected.filter(r=>r.stage===s.stage);
  const reasons=[];
  if(x[key]===null||x[key]<=0)reasons.push("positive measured material quantity required");
  if(!baseline.length||!post.length)reasons.push("baseline or selected endpoint absent");
  if(selected.some(r=>r.status!=="ok"))reasons.push("non-numeric reading at comparison endpoint");
  if(selected.some(r=>r.damage))reasons.push("damage recorded at comparison endpoint");
  if(selected.some(r=>r.tempC===null||r.humidityPct===null))reasons.push("environment missing");
  const b=describe(baseline.filter(r=>r.status==="ok").map(r=>r.resistanceOhm)).median;
  const p=describe(post.filter(r=>r.status==="ok").map(r=>r.resistanceOhm)).median;
  if(b===null||b<=0)reasons.push("positive baseline required");
  const environment=rows=>({temp:describe(rows.map(r=>r.tempC).filter(v=>v!==null)).median,humidity:describe(rows.map(r=>r.humidityPct).filter(v=>v!==null)).median});
  const before=environment(baseline),after=environment(post);
  // Reject within-specimen environmental drift as well as between-specimen mismatch.
  for(const k of ["temp","humidity"]){const v=selected.map(r=>k==="temp"?r.tempC:r.humidityPct).filter(v=>v!==null),limit=k==="temp"?2:5;if(v.length&&Math.max(...v)-Math.min(...v)>limit)reasons.push("environment varies beyond tolerance: "+k);}
  const status_counts={ok:0,open:0,failed:0,missing:0};for(const r of selected)status_counts[r.status]++;
  const change=b>0&&p!==null?100*(p-b)/b:null;
  if(change!==null&&!Number.isFinite(change))reasons.push("nonfinite percent change");
  return {id:x.id,design:x.design,lot:x.lot,substrate:x.substrate,width:x.widthMm,height:x.heightMm,material:x[key],before,after,baseline_ohm:b,post_ohm:p,change_pct:Number.isFinite(change)?change:null,reasons,status_counts,damage:selected.some(r=>r.damage),selected_reading_ids:selected.map(r=>r.id)};
 });
 const byId=new Map(specimens.map(x=>[x.id,x]));
 if(!Array.isArray(s.pairs)||s.pairs.length>250)throw new RangeError("pair list");
 const used=new Set(),pairs=s.pairs.map(pair=>{
  if(!Array.isArray(pair)||pair.length!==2)throw new RangeError("pair format");
  const [a,b]=pair.map(id=>byId.get(id));
  if(!a||!b||a.design!==s.candidate||b.design!==s.reference||used.has(a.id)||used.has(b.id))throw new RangeError("pair design or specimen reuse");
  used.add(a.id);used.add(b.id);
  const reasons=[...a.reasons.map(x=>a.id+": "+x),...b.reasons.map(x=>b.id+": "+x)];
  if(a.lot!==b.lot)reasons.push("material lot mismatch");if(a.substrate!==b.substrate)reasons.push("substrate mismatch");
  if(Math.abs(a.width-b.width)>1||Math.abs(a.height-b.height)>1)reasons.push("dimensions mismatch");
  if(a.material>0&&b.material>0&&Math.abs(a.material-b.material)/Math.max(a.material,b.material)>.05)reasons.push("material quantity mismatch");
  for(const stage of ["before","after"])for(const k of ["temp","humidity"]){const x=a[stage][k],y=b[stage][k];if(x!==null&&y!==null&&Math.abs(x-y)>(k==="temp"?2:5))reasons.push(stage+" "+k+" mismatch");}
  const delta=a.change_pct!==null&&b.change_pct!==null?a.change_pct-b.change_pct:null;
  if(delta!==null&&!Number.isFinite(delta))reasons.push("nonfinite contrast");
  return {candidate:a.id,reference:b.id,eligible:!reasons.length,reasons,delta_change_percentage_points:!reasons.length?delta:null};
 });
 const eligible=pairs.filter(p=>p.eligible),deltas=eligible.map(p=>p.delta_change_percentage_points);
 return {version:1,settings:{candidate:s.candidate,reference:s.reference,stage:s.stage,cycles:s.cycles,matchBy:s.matchBy,method,pairs:s.pairs.map(p=>[...p])},tolerances,specimens,pairs,unpaired:specimens.filter(x=>!used.has(x.id)).map(x=>x.id),summary:{eligible_pairs:eligible.length,excluded_pairs:pairs.length-eligible.length,contrast_pp:describe(deltas)},warnings:["Explicit user-declared pairs only; no automatic matching or reuse.","Negative contrast means smaller signed resistance change, not necessarily superior durability.","Non-numeric or damaged endpoints excluded from numeric contrast, retained in specimen status counts. Other methods/stages are not analyzed; raw register remains authoritative.","Material, method and environmental checks do not verify actual construction, randomization, independence or experimental provenance.","Exploratory tolerances are not standards; no confidence intervals, pooled uncertainty, significance or health claim."]};
}
