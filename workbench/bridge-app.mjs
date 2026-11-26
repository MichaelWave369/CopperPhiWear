import {createBridge,validateBridge,addLink,removeRecord,analyzeBridge} from "./bridge.mjs";
import {readVault,MAX_CHARS} from "./vault.mjs";
const $=id=>document.getElementById(id);let records=[],links=[],report=null;
function current(){return createBridge({name:$("name").value,notes:$("notes").value,paper:$("paper").value,records,links});}
function invalidate(){report=null;$("reportExport").disabled=true;$("summary").textContent="";}
function say(s){$("status").textContent=s;}
function option(s,r){const o=document.createElement("option");o.value=r.id;o.textContent=r.name+" · "+r.kind;s.append(o);}
function refresh(){const s=$("available");s.replaceChildren();try{for(const r of readVault(localStorage).records.filter(r=>!records.some(a=>a.id===r.id)))option(s,r);$("capture").disabled=!s.options.length;}catch(e){$("capture").disabled=true;say(e.message);}}
function render(){for(const id of ["from","to","records","links"])$(id).replaceChildren();
 for(const r of records){option($("from"),r);option($("to"),r);const d=document.createElement("div"),b=document.createElement("button");d.textContent=r.name+" · "+r.kind+" · "+r.id;b.textContent="Remove captured copy";b.addEventListener("click",()=>{try{records=removeRecord(current(),r.id).records;changed();}catch(e){say(e.message);}});d.append(b);$("records").append(d);}
 for(const l of links){const d=document.createElement("div"),b=document.createElement("button");d.textContent=l.kind+": "+l.from+" → "+l.to+" | "+l.note;b.textContent="Remove relation";b.addEventListener("click",()=>{links=links.filter(x=>x!==l);changed();});d.append(b);$("links").append(d);}
 refresh();}
function changed(){invalidate();render();}
$("refresh").addEventListener("click",refresh);window.addEventListener("storage",refresh);
$("capture").addEventListener("click",()=>{try{const r=readVault(localStorage).records.find(x=>x.id===$("available").value);if(!r)throw new Error("Snapshot not available");records=validateBridge({...current(),records:[...records,r]}).records;changed();say("Source snapshot captured.");}catch(e){say(e.message);}});
$("link").addEventListener("click",()=>{try{links=addLink(current(),{kind:$("kind").value,from:$("from").value,to:$("to").value,note:$("reason").value}).links;changed();say("Context relation added.");}catch(e){say(e.message);}});
for(const id of ["name","notes","paper"])$(id).addEventListener("input",invalidate);
function save(name,value){const u=URL.createObjectURL(new Blob([JSON.stringify(value)],{type:"application/json"}));const a=document.createElement("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$("export").addEventListener("click",()=>{try{save("phi-bridge-project.json",current());say("Project export prepared.");}catch(e){say(e.message);}});
$("import").addEventListener("change",async()=>{try{const f=$("import").files[0];if(!f)return;if(f.size>MAX_CHARS*4)throw new Error("File too large");const raw=await f.text();if(raw.length>MAX_CHARS)throw new Error("File too large");const p=validateBridge(JSON.parse(raw));if(!confirm("Replace current project editor? Export current work first."))return;records=p.records;links=p.links;$("name").value=p.name;$("notes").value=p.notes;$("paper").value=p.paper;changed();say("Manifest imported. Vault unchanged.");}catch(e){say(e.message);}finally{$("import").value="";}});
$("report").addEventListener("click",()=>{invalidate();try{report=analyzeBridge(current());$("summary").textContent=JSON.stringify(report,null,2);$("reportExport").disabled=false;say("Derived report generated.");}catch(e){say(e.message);}});
$("reportExport").addEventListener("click",()=>{if(report)save("phi-bridge-report.json",report);});render();
