import {names} from "./geometry.mjs";
import {swatchSheet,checkCalibration,fabricationPlan,inventoryCsv} from "./fabrication.mjs";
const $=id=>document.getElementById(id);let sheet=null,project=null,plan=null;
for(const n of names){const o=document.createElement("option");o.value=n;o.textContent=n;$("pattern").append(o);}
function save(name,body,type){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function draw(){sheet=null;$("svg").disabled=true;$("preview").replaceChildren();$("calStatus").textContent="";try{sheet=swatchSheet($("pattern").value,$("size").valueAsNumber,$("paper").value);$("preview").innerHTML=sheet.svg;$("sheetStatus").textContent="Sheet fits selected paper. Calibration required after printing.";$("svg").disabled=false;}catch(e){$("sheetStatus").textContent=e.message;}}
function resetPlan(){plan=null;$("csv").disabled=true;$("json").disabled=true;$("inventory").textContent="";$("references").replaceChildren();}
function build(){resetPlan();if(!project)return;try{plan=fabricationPlan(project,$("paper").value);$("inventory").textContent=JSON.stringify({inventory:plan.inventory,no_fit:plan.no_fit,warnings:plan.warnings},null,2);
 for(const g of plan.references){const p=document.createElement("p");p.textContent=g.pattern+" / "+g.size_mm+" mm / "+g.quantity+" tiles"+(g.printable?"":" — "+g.reason);$("references").append(p);
 if(g.printable){const b=document.createElement("button");b.textContent="Export "+g.key+" reference";b.addEventListener("click",()=>{const s=swatchSheet(g.pattern,g.size_mm,plan.paper);save(g.key+".svg",s.svg,"image/svg+xml");});$("references").append(b);}}
 $("status").textContent="Inventory generated; oversized sheets are flagged, not scaled.";$("csv").disabled=false;$("json").disabled=false;}catch(e){$("status").textContent="Project rejected: "+e.message;}}
for(const id of ["pattern","size","paper"])$(id).addEventListener("input",()=>{draw();if(id==="paper")build();});
$("svg").addEventListener("click",()=>{if(sheet)save(sheet.pattern+"-"+sheet.size_mm+"-"+sheet.paper+".svg",sheet.svg,"image/svg+xml");});
$("calibrate").addEventListener("click",()=>{try{const r=checkCalibration($("horizontal").valueAsNumber,$("vertical").valueAsNumber);$("calStatus").textContent=(r.pass?"Within tolerance":"Outside tolerance; adjust print settings and reprint")+" (horizontal "+(r.horizontal_error_fraction*100).toFixed(2)+"%, vertical "+(r.vertical_error_fraction*100).toFixed(2)+"%).";}catch(e){$("calStatus").textContent=e.message;}});
$("project").addEventListener("change",async()=>{project=null;resetPlan();try{const f=$("project").files[0];if(!f)return;if(f.size>100000)throw new Error("Project too large");project=JSON.parse(await f.text());build();}catch(e){$("status").textContent=e.message;}finally{$("project").value="";}});
$("csv").addEventListener("click",()=>{if(plan)save("phi-tile-inventory.csv",inventoryCsv(plan),"text/csv");});
$("json").addEventListener("click",()=>{if(plan)save("phi-fabrication-plan.json",JSON.stringify(plan,null,2),"application/json");});draw();
