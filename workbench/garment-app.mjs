import {names,generate,toSvg} from "./geometry.mjs";
import {zones,blankProject,validateProject,analyzeProject} from "./garment.mjs";
const $=id=>document.getElementById(id);let project=blankProject(),report=null;
const shapes=[
 ["front-left","M27 28H45V75H25V42Z"],["front-right","M47 28H65L67 42V75H47Z"],
 ["back-left","M115 28H130V75H113V42Z"],["back-right","M138 28H153L155 42V75H138Z"],
 ["left-sleeve","M14 34L22 37L13 70L5 67Z"],["right-sleeve","M70 37L78 34L87 67L79 70Z"],
 ["left-shoulder","M18 28L25 24L25 35L17 34Z"],["right-shoulder","M67 24L74 28L75 34L67 35Z"],
 ["back-center","M132 28H136V75H132Z"]
];
function updateMap(){
 const active=new Set(project.panels.filter(p=>p.enabled).map(p=>p.id));
 $("map").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 94" role="img" aria-label="Front and back schematic"><g fill="#393a3c" stroke="#777" stroke-width=".7"><path d="M33 24Q29 8 46 6Q63 8 59 24L76 28L90 70L78 75L70 48V80H22V48L14 75L2 70L16 28Z"/><path d="M121 24Q117 8 134 6Q151 8 147 24L164 28L178 70L166 75L158 48V80H110V48L102 75L90 70L104 28Z"/></g>'+shapes.map(([id,d])=>'<path d="'+d+'" fill="'+(active.has(id)?"#b87333":"#4b4c4e")+'" stroke="#e3b18a" stroke-width=".4"><title>'+id+'</title></path>').join("")+'<g font-size="5" fill="#eee" text-anchor="middle"><text x="46" y="90">FRONT</text><text x="134" y="90">BACK</text></g></svg>';
}
function invalidate(){report=null;$("report").disabled=true;$("results").textContent="";$("status").textContent="Changes not yet calculated.";updateMap();}
function field(root,label,value,change,{min=0,max=3000,step="any",disabled=false}={}){
 const l=document.createElement("label");l.textContent=label;const i=document.createElement("input");i.type="number";i.min=min;i.max=max;i.step=step;i.value=value??"";i.disabled=disabled;
 i.addEventListener("input",()=>{change(i.value===""?null:i.valueAsNumber);invalidate();});l.append(i);root.append(l);return i;
}
function render(){
 const m=$("material");m.replaceChildren();for(const [key,label,min,max] of [["linearMassGPerM","Yarn g/m",.000001,10000],["linearResistanceOhmPerM","Yarn Ω/m",.000001,1e8],["copperMassFraction","Copper mass fraction",0,1],["wasteFraction","Purchase allowance fraction",0,1]])field(m,label,project.material[key],v=>project.material[key]=v,{min,max});
 const root=$("panels");root.replaceChildren();for(const p of project.panels){
  const z=zones.find(z=>z.id===p.id),section=document.createElement("section");section.className="zone";
  const label=document.createElement("label"),check=document.createElement("input");check.type="checkbox";check.checked=p.enabled;label.append(check,document.createTextNode(" "+z.label));section.append(label);
  check.addEventListener("change",()=>{p.enabled=check.checked;render();invalidate();});
  const sl=document.createElement("label"),select=document.createElement("select");sl.textContent="Motif";for(const name of names){const o=document.createElement("option");o.value=name;o.textContent=name;select.append(o);}select.value=p.pattern;select.disabled=!p.enabled;sl.append(select);section.append(sl);
  const preview=document.createElement("div");function draw(){try{preview.innerHTML=toSvg(generate(p.pattern,{size:p.tileMm}));}catch{preview.replaceChildren();}}
  select.addEventListener("change",()=>{p.pattern=select.value;draw();invalidate();});
  for(const [k,l,min,max,step] of [["widthMm","Measured width (mm)",1,3000,"any"],["heightMm","Measured height (mm)",1,3000,"any"],["tileMm","Tile size (mm)",10,1000,1],["gapMm","Gap (mm)",0,500,"any"],["marginMm","Margin (mm)",0,500,"any"]])field(section,l,p[k],v=>{p[k]=v;draw();},{min,max,step,disabled:!p.enabled});
  draw();section.append(preview);root.append(section);
 }updateMap();
}
function download(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("calculate").addEventListener("click",()=>{invalidate();try{report=analyzeProject(project);$("results").textContent=JSON.stringify({totals:report.totals,no_fit:report.no_fit,panels:report.panels.map(p=>({id:p.id,pattern:p.pattern,tiles:p.packing.tiles,length_mm:p.packing.total_centerline_mm})),warnings:report.warnings},null,2);$("status").textContent=report.no_fit.length?"Some enabled panels cannot fit a tile. Review measurements.":"Inventory calculated; estimates only.";$("report").disabled=false;}catch(e){$("status").textContent="Check inputs: "+e.message;}});
$("report").addEventListener("click",()=>{if(report)download("phi-garment-inventory.json",report);});
$("save").addEventListener("click",()=>{try{download("phi-garment-project.json",validateProject(project));}catch(e){$("status").textContent="Check inputs: "+e.message;}});
$("load").addEventListener("change",async()=>{try{const f=$("load").files[0];if(!f)return;if(f.size>100000)throw new Error("Project file too large");project=validateProject(JSON.parse(await f.text()));render();invalidate();}catch(e){$("status").textContent="Import rejected: "+e.message;}finally{$("load").value="";}});
$("reset").addEventListener("click",()=>{project=blankProject();render();invalidate();});render();
