import {blankMaterial,validateMaterial,reviewMaterial,checks} from "./material.mjs";
const $=id=>document.getElementById(id);let report=null;
for(const c of checks){const li=document.createElement("li");li.textContent=c.id+" — "+c.label;$("checks").append(li);}
function clear(){report=null;$("result").textContent="";$("export").disabled=true;$("report").disabled=true;}
function evaluate(){clear();try{if($("record").value.length>100000)throw new RangeError("record too large");report=reviewMaterial(JSON.parse($("record").value));$("status").textContent=report.status;$("result").textContent=JSON.stringify(report,null,2);$("export").disabled=false;$("report").disabled=false;}catch(e){$("status").textContent=e.message;}}
$("record").value=JSON.stringify(blankMaterial(),null,2);$("record").addEventListener("input",()=>{clear();$("status").textContent="Edits not evaluated";});
$("evaluate").addEventListener("click",evaluate);
$("import").addEventListener("change",async()=>{try{const f=$("import").files[0];if(!f)return;if(f.size>400000)throw new Error("file too large");const raw=await f.text();if(raw.length>100000)throw new Error("record too large");const next=validateMaterial(JSON.parse(raw));if(!confirm("Replace current editor? Export first if needed."))return;$("record").value=JSON.stringify(next,null,2);evaluate();}catch(e){$("status").textContent="Import rejected: "+e.message;}finally{$("import").value="";}});
function save(name,value){const u=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$("export").addEventListener("click",()=>{if(report)save("phi-material.json",report.record);});
$("report").addEventListener("click",()=>{if(report)save("phi-material-review.json",report);});evaluate();
