import {names} from "./geometry.mjs";
// Exploratory, detached textile measurements. No health or personal data.
export const designs=Object.freeze(["plain-control","straight-reference",...names]);
export const stages=Object.freeze(["baseline","flex","abrasion"]);
const str=(x,k,max=160)=>{if(typeof x!=="string"||!x.trim()||x.length>max)throw new RangeError(k);return x.trim();};
const num=(x,k,min,max)=>{if(typeof x!=="number"||!Number.isFinite(x)||x<min||x>max)throw new RangeError(k);return x;};
const id=x=>{if(typeof x!=="string"||!/^[A-Za-z0-9_-]{1,48}$/.test(x))throw new RangeError("identifier");return x;};
const integer=(x,k,min,max)=>{num(x,k,min,max);if(!Number.isInteger(x))throw new RangeError(k);return x;};
const optional=(x,k,min,max)=>x===null?null:num(x,k,min,max);
export function blankLab(){return {version:1,samples:[],readings:[]};}
export function validateLab(input){
 if(!input||input.version!==1||!Array.isArray(input.samples)||!Array.isArray(input.readings)||input.samples.length>500||input.readings.length>10000)throw new RangeError("lab format or capacity");
 const seen=new Set(),samples=input.samples.map(s=>{
  if(!s||!designs.includes(s.design))throw new RangeError("sample design");
  const key=id(s.id);if(seen.has(key))throw new RangeError("duplicate sample");seen.add(key);
  return {id:key,design:s.design,lot:str(s.lot,"material lot"),substrate:str(s.substrate,"substrate"),
   widthMm:num(s.widthMm,"width",1,1000),heightMm:num(s.heightMm,"height",1,1000),
   conductorLengthMm:optional(s.conductorLengthMm,"length",0,1e7),
   conductorMassG:optional(s.conductorMassG,"mass",0,10000),
   notes:typeof s.notes==="string"&&s.notes.length<=500?s.notes:(()=>{throw new RangeError("notes");})()};
 });
 const readIds=new Set(),readings=input.readings.map(r=>{
  if(!r||!seen.has(r.sampleId)||!stages.includes(r.stage)||!["ok","open","failed","missing"].includes(r.status))throw new RangeError("reading identity or status");
  const key=id(r.id);if(readIds.has(key))throw new RangeError("duplicate reading");readIds.add(key);
  const resistance=optional(r.resistanceOhm,"resistance",0,1e9),unc=optional(r.uncertaintyOhm,"absolute uncertainty",0,1e9);
  if(r.status==="ok"?resistance===null:resistance!==null||unc!==null)throw new RangeError("reading value/status mismatch");
  const cycles=integer(r.cycles,"cycles",0,1e8);if(r.stage==="baseline"&&cycles!==0)throw new RangeError("baseline cycles");
  if(r.stage!=="baseline"&&cycles===0)throw new RangeError("post-test cycles");
  if(typeof r.damage!=="boolean")throw new RangeError("damage flag");
  const notes=typeof r.notes==="string"&&r.notes.length<=500?r.notes:(()=>{throw new RangeError("notes");})();
  if(r.status!=="ok"&&!notes.trim())throw new RangeError("non-numeric reading requires reason");
  return {id:key,sampleId:r.sampleId,stage:r.stage,status:r.status,cycles,resistanceOhm:resistance,uncertaintyOhm:unc,damage:r.damage,
   method:str(r.method,"measurement method",200),tempC:optional(r.tempC,"temperature",-30,100),humidityPct:optional(r.humidityPct,"humidity",0,100),notes};
 });
 return {version:1,samples,readings};
}
export function appendSample(lab,sample){return validateLab({...lab,samples:[...lab.samples,sample]});}
export function appendReading(lab,reading){return validateLab({...lab,readings:[...lab.readings,reading]});}
export function describe(values){
 if(!values.length)return {n:0,median:null,min:null,max:null};
 const a=[...values].sort((x,y)=>x-y),i=Math.floor(a.length/2);
 return {n:a.length,median:a.length%2?a[i]:(a[i-1]+a[i])/2,min:a[0],max:a.at(-1)};
}
export function summarizeLab(input){
 const lab=validateLab(input),groups=new Map();
 for(const s of lab.samples){let g=groups.get(s.design);if(!g){g={design:s.design,sample_count:0,readings:0,ok:0,open:0,failed:0,missing:0,damaged_samples:0,baselineValues:[],flex:new Map(),abrasion:new Map()};groups.set(s.design,g);}
  g.sample_count++;
  const rr=lab.readings.filter(r=>r.sampleId===s.id);g.readings+=rr.length;
  for(const r of rr)g[r.status]++;if(rr.some(r=>r.damage))g.damaged_samples++;
  const baseline=describe(rr.filter(r=>r.stage==="baseline"&&r.status==="ok").map(r=>r.resistanceOhm)).median;
  if(baseline!==null)g.baselineValues.push(baseline);
  for(const stage of ["flex","abrasion"]){
   const by=new Map();
   for(const r of rr.filter(r=>r.stage===stage&&r.status==="ok")){if(!by.has(r.cycles))by.set(r.cycles,[]);by.get(r.cycles).push(r.resistanceOhm);}
   for(const [cycles,values] of by){
    const v=describe(values).median;if(!g[stage].has(cycles))g[stage].set(cycles,{values:[],changes:[]});
    const b=g[stage].get(cycles);b.values.push(v);if(baseline!==null&&baseline>0)b.changes.push(100*(v-baseline)/baseline);
   }
  }
 }
 return {sample_count:lab.samples.length,reading_count:lab.readings.length,groups:[...groups.values()].map(g=>{
  const {baselineValues,flex,abrasion,...counts}=g;
  const stagesToArray=m=>[...m].sort(([a],[b])=>a-b).map(([cycles,b])=>({cycles,resistance_ohm:describe(b.values),paired_change_pct:describe(b.changes)}));
  return {...counts,baseline_ohm:describe(baselineValues),flex:stagesToArray(flex),abrasion:stagesToArray(abrasion)};
 }),warnings:["Descriptive only; one median per independent sample per stage/cycle count.","Missing, failed and open readings are counted, never replaced with zero.","No pooled uncertainty or significance estimate; recorded instrument uncertainty is retained in raw readings.","Compare matched lots, dimensions, conductor mass, test methods and cycle counts before interpretation.","No medical or on-body measurements."]};
}
// Spreadsheet-safe text: neutralize formulas including leading whitespace.
const cell=v=>{let s=v===null?"":String(v);if(typeof v==="string"&&/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
export function readingsCsv(input){
 const l=validateLab(input),keys=["id","sampleId","stage","status","cycles","resistanceOhm","uncertaintyOhm","damage","method","tempC","humidityPct","notes"];
 return [keys,...l.readings.map(r=>keys.map(k=>r[k]))].map(r=>r.map(cell).join(",")).join("\r\n")+"\r\n";
}
