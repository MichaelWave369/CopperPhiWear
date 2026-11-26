import {names,generate,toSvg} from "./geometry.mjs";
import {estimateMaterial,panelPlan,endpointGraph} from "./textile.mjs";
const $=id=>document.getElementById(id),num=id=>$(id).valueAsNumber;
let report=null;
for(const name of names){const o=document.createElement("option");o.value=name;o.textContent=name;$("pattern").append(o);}
function preview(){try{$("preview").innerHTML=toSvg(generate($("pattern").value,{size:num("size")}));}catch{$("preview").replaceChildren();}}
function invalidate(){report=null;$("export").disabled=true;$("result").textContent="";$("status").textContent="Enter documented material values and calculate.";preview();}
$("form").addEventListener("input",invalidate);
$("form").addEventListener("submit",e=>{e.preventDefault();invalidate();try{
 const model=generate($("pattern").value,{size:num("size")});
 const panel=panelPlan({widthMm:num("width"),heightMm:num("height"),tileMm:num("size"),quantity:num("quantity"),tileLengthMm:model.metrics.centerline_length_mm});
 const material=estimateMaterial(panel.total_centerline_mm,{linearMassGPerM:num("mass"),linearResistanceOhmPerM:num("resistance"),copperMassFraction:num("copper")});
 const graph=endpointGraph(model.paths,[],num("size"),num("resistance"));
 report={version:"0.3",geometry:model.metrics,panel,material,inputs:{width_mm:num("width"),height_mm:num("height"),linear_mass_g_m:num("mass"),linear_resistance_ohm_m:num("resistance"),copper_mass_fraction:num("copper"),gap_mm:5,margin_mm:10,waste_fraction:.1},isolated_swatch:{components:graph.components,cycle_rank:graph.cycle_rank},limitations:"No inferred junctions, no physical validation, no medical claim."};
 $("result").textContent=JSON.stringify(report,null,2);$("status").textContent="Calculated from supplied material values; not independently verified.";$("export").disabled=false;
 }catch(err){$("status").textContent="Invalid input: "+err.message;}});
$("export").addEventListener("click",()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="phi-textile-report.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});preview();
