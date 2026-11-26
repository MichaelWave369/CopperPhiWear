import {names,generate,toSvg} from "./geometry.mjs";
import {optimize,optimizeCsv} from "./optimize.mjs";
const $=id=>document.getElementById(id);let report=null;
for(const n of names){const l=document.createElement("label"),c=document.createElement("input");c.type="checkbox";c.value=n;c.checked=true;l.append(c,document.createTextNode(" "+n));$("families").append(l);}
function clear(){report=null;$("results").replaceChildren();$("preview").replaceChildren();$("detail").textContent="";$("json").disabled=true;$("csv").disabled=true;}
$("search").addEventListener("input",()=>{clear();$("status").textContent="Settings changed; run search.";});
const opt=id=>$(id).value===""?null:$(id).valueAsNumber;
$("search").addEventListener("submit",e=>{e.preventDefault();clear();try{
 report=optimize({patterns:[...$("families").querySelectorAll("input:checked")].map(c=>c.value),size:$("size").valueAsNumber,resolution:$("resolution").valueAsNumber,maxLengthMm:opt("length"),maxPaths:opt("paths"),minOccupancy:$("occupancy").valueAsNumber});
 $("status").textContent=report.candidate_count+" candidates; "+report.feasible_count+" feasible; "+report.front.length+" non-dominated. Equal-objective candidates retained.";
 for(const r of report.front){const b=document.createElement("button");b.type="button";b.textContent=r.pattern+" | "+r.length_mm.toFixed(1)+" mm | "+r.path_count+" paths | "+(100*r.occupied_fraction).toFixed(1)+"% grid";
 b.addEventListener("click",()=>{$("preview").innerHTML=toSvg(generate(r.pattern,r.parameters));$("detail").textContent=JSON.stringify(r,null,2);});$("results").append(b);}
 $("json").disabled=false;$("csv").disabled=false;
 }catch(err){$("status").textContent=err.message;}});
function save(name,data,mime){const u=URL.createObjectURL(new Blob([data],{type:mime}));const a=document.createElement("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$("json").addEventListener("click",()=>{if(report)save("phi-optimize.json",JSON.stringify(report,null,2),"application/json");});
$("csv").addEventListener("click",()=>{if(report)save("phi-pareto.csv",optimizeCsv(report),"text/csv");});
