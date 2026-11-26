import {createStudy,studyReference,studyCsv,checklist} from "./wear.mjs";
const $=id=>document.getElementById(id);let study=null;
for(const c of checklist){const li=document.createElement("li");li.textContent=c;$("checks").append(li);}
function save(name,body,mime){const url=URL.createObjectURL(new Blob([body],{type:mime}));const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function clear(){study=null;$("summary").textContent="";$("refs").replaceChildren();for(const id of ["json","csv","lab"])$(id).disabled=true;}
$("study").addEventListener("input",()=>{clear();$("status").textContent="Settings changed; generate again.";});
$("study").addEventListener("submit",e=>{e.preventDefault();clear();try{
 study=createStudy({scope:$("scope").value,replicates:$("replicates").valueAsNumber,size:$("size").valueAsNumber,seed:$("seed").valueAsNumber,paper:$("paper").value,lot:$("lot").value,substrate:$("substrate").value});
 $("summary").textContent=JSON.stringify({specimens:study.specimens.length,order:study.measurement_order,controls:study.controls,limitations:study.limitations},null,2);
 for(const r of study.references){const b=document.createElement("button");b.textContent="Export "+r.design+" sheet";b.addEventListener("click",()=>{if(study)save(r.filename,studyReference(study,r.design),"image/svg+xml");});$("refs").append(b);}
 for(const id of ["json","csv","lab"])$(id).disabled=false;
 $("status").textContent="Plan generated. No samples have been fabricated or measured.";
 }catch(e){$("status").textContent=e.message;}});
$("json").addEventListener("click",()=>{if(study)save("phi-wear-study.json",JSON.stringify(study,null,2),"application/json");});
$("csv").addEventListener("click",()=>{if(study)save("phi-wear-specimens.csv",studyCsv(study),"text/csv");});
$("lab").addEventListener("click",()=>{if(study)save("phi-wear-lab-seed.json",JSON.stringify(study.lab_seed,null,2),"application/json");});
