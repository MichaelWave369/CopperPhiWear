import {designs,validateLab} from "./laboratory.mjs";
import {compareEvidence} from "./evidence.mjs";
import {mountVault} from "./vault-ui.mjs";
const $=id=>document.getElementById(id);let lab=null,result=null;
for(const id of ["candidate","reference"])for(const d of designs){const o=document.createElement("option");o.value=d;o.textContent=d;$(id).append(o);}
$("candidate").value="tri-braid";$("reference").value="straight-reference";
function invalidate(){result=null;$("result").textContent="";$("export").disabled=true;}
function load(v){const next=validateLab(v);lab=next;invalidate();$("pairs").value="";$("source").textContent=lab.samples.length+" registered specimens; "+lab.readings.length+" readings (not independently verified).";$("specimens").textContent=JSON.stringify(lab.samples.map(s=>({id:s.id,design:s.design,lot:s.lot,mass_g:s.conductorMassG,length_mm:s.conductorLengthMm})),null,2);$("compare").disabled=false;}
$("file").addEventListener("change",async()=>{try{const f=$("file").files[0];if(!f)return;if(f.size>12000000)throw new Error("File too large");load(JSON.parse(await f.text()));$("status").textContent="Register loaded.";}catch(e){$("status").textContent="Import rejected: "+e.message;}finally{$("file").value="";}});
for(const id of ["candidate","reference","stage","cycles","match","method","pairs"])$(id).addEventListener("input",invalidate);
$("compare").addEventListener("click",()=>{invalidate();try{const pairs=$("pairs").value.split(/\r?\n/).filter(x=>x.trim()).map(x=>x.split(",").map(v=>v.trim()));result=compareEvidence(lab,{candidate:$("candidate").value,reference:$("reference").value,stage:$("stage").value,cycles:$("cycles").valueAsNumber,matchBy:$("match").value,method:$("method").value,pairs});$("result").textContent=JSON.stringify(result,null,2);$("status").textContent=result.summary.eligible_pairs+" eligible declared pairs; "+result.summary.excluded_pairs+" excluded. Descriptive only.";$("export").disabled=false;}catch(e){$("status").textContent=e.message;}});
$("export").addEventListener("click",()=>{if(!result)return;const u=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=u;a.download="phi-evidence.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);});
mountVault({kind:"laboratory",load});
