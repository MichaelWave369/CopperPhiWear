import {designs,blankLab,validateLab,appendSample,appendReading,summarizeLab,readingsCsv} from "./laboratory.mjs";
const $=id=>document.getElementById(id);let lab=blankLab();
for(const d of designs){const o=document.createElement("option");o.value=d;o.textContent=d;$("design").append(o);}
function render(){const current=$("samples").value;$("samples").replaceChildren();for(const s of lab.samples){const o=document.createElement("option");o.value=s.id;o.textContent=s.id+" / "+s.design;$("samples").append(o);}if(lab.samples.some(s=>s.id===current))$("samples").value=current;$("summary").textContent=JSON.stringify(summarizeLab(lab),null,2);$("raw").textContent=JSON.stringify(lab,null,2);}
function values(form,numeric){const d=Object.fromEntries(new FormData(form));for(const k of numeric)d[k]=d[k]===""||d[k]===undefined?null:Number(d[k]);return d;}
function syncStatus(){const ok=$("readingStatus").value==="ok";$("resistance").disabled=!ok;$("resistance").required=ok;$("uncertainty").disabled=!ok;if(!ok){$("resistance").value="";$("uncertainty").value="";}}
$("readingStatus").addEventListener("change",syncStatus);
$("sample").addEventListener("submit",e=>{e.preventDefault();try{lab=appendSample(lab,values(e.currentTarget,["widthMm","heightMm","conductorLengthMm","conductorMassG"]));e.currentTarget.reset();render();$("status").textContent="Sample registered. Export JSON to retain records.";}catch(err){$("status").textContent=err.message;}});
$("reading").addEventListener("submit",e=>{e.preventDefault();try{const r=values(e.currentTarget,["cycles","resistanceOhm","uncertaintyOhm","tempC","humidityPct"]);r.damage=e.currentTarget.elements.damage.checked;lab=appendReading(lab,r);e.currentTarget.reset();syncStatus();render();$("status").textContent="Reading appended. Export JSON to retain records.";}catch(err){$("status").textContent=err.message;}});
function save(name,body,mime){const url=URL.createObjectURL(new Blob([body],{type:mime}));const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("save").addEventListener("click",()=>save("phi-lab.json",JSON.stringify(lab,null,2),"application/json"));
$("csv").addEventListener("click",()=>save("phi-readings.csv",readingsCsv(lab),"text/csv"));
$("report").addEventListener("click",()=>save("phi-lab-summary.json",JSON.stringify(summarizeLab(lab),null,2),"application/json"));
$("import").addEventListener("change",async()=>{try{const f=$("import").files[0];if(!f)return;if(f.size>12000000)throw new Error("File too large");const next=validateLab(JSON.parse(await f.text()));if(lab.samples.length&&!confirm("Replace current in-memory register? Export first if needed."))return;lab=next;render();$("status").textContent="Register imported.";}catch(err){$("status").textContent="Import rejected: "+err.message;}finally{$("import").value="";}});render();syncStatus();

import {mountVault} from "./vault-ui.mjs";
mountVault({kind:"laboratory",read:()=>lab,load:value=>{lab=validateLab(value);render();}});
