import {names} from "./geometry.mjs";
import {createJunction,validateJunction,addBond,removeBond,analyzeJunction} from "./junction.mjs";
import {mountVault} from "./vault-ui.mjs";
const $=id=>document.getElementById(id);let p=null,result=null;
for(const n of names){const o=document.createElement("option");o.value=n;o.textContent=n;$("pattern").append(o);}
$("pattern").value="golden-branch";
const colors=["#db985f","#75b5cd","#a3c38b","#b8a0e6","#ead27c","#ef8fa1"];
function say(s){$("status").textContent=s;}
function draw(){
 const a=Number($("a").value),b=Number($("b").value);
 const paths=result.paths.map((line,i)=>'<polyline points="'+line.map(v=>v.join(",")).join(" ")+'" fill="none" stroke="'+colors[result.pathComponents[i]%colors.length]+'" stroke-width=".7"/>').join("");
 const points=result.endpoints.map(e=>'<circle cx="'+e.point[0]+'" cy="'+e.point[1]+'" r="'+(e.id===a||e.id===b?1.8:.8)+'" fill="'+(e.id===a?"#fff":e.id===b?"#f2d575":"#888")+'"><title>Endpoint '+e.id+'</title></circle>').join("");
 $("network").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 104 104">'+paths+points+'</svg>';
}
function render(next){
 const r=analyzeJunction(next);p=r.project;result=r;
 for(const [id,fallback] of [["a",p.terminals[0]],["b",p.terminals[1]]]){
 const s=$(id);s.replaceChildren();for(const e of r.endpoints){const o=document.createElement("option");o.value=e.id;o.textContent=e.id+" · path "+e.path+" "+e.side+" ("+e.point.map(v=>v.toFixed(2)).join(", ")+")";s.append(o);}s.value=fallback;}
 $("rate").value=p.ohmPerM??"";$("bonds").replaceChildren();
 p.bonds.forEach((pair,i)=>{const b=document.createElement("button");b.textContent="Remove bond "+pair.join(" ↔ ");b.addEventListener("click",()=>attempt(()=>removeBond(p,i)));$("bonds").append(b);});
 $("metrics").textContent=JSON.stringify({...r.metrics,terminals:p.terminals,warnings:r.warnings},null,2);draw();
}
function attempt(fn){try{render(fn());say("Network updated. Ideal detached model only.");}catch(e){say(e.message);}}
function newSource(source){if(p&&!confirm("Replace the current network and its bonds? Export first if needed."))return;attempt(()=>createJunction(source));}
$("new").addEventListener("click",()=>newSource({kind:"pattern",pattern:$("pattern").value,parameters:{size:$("size").valueAsNumber}}));
for(const id of ["a","b"])$(id).addEventListener("change",draw);
$("bond").addEventListener("click",()=>attempt(()=>addBond(p,Number($("a").value),Number($("b").value))));
$("terminals").addEventListener("click",()=>attempt(()=>validateJunction({...p,terminals:[Number($("a").value),Number($("b").value)]})));
$("apply").addEventListener("click",()=>attempt(()=>validateJunction({...p,ohmPerM:$("rate").value===""?null:$("rate").valueAsNumber})));
for(const id of ["hybrid","import"])$(id).addEventListener("change",async()=>{try{const f=$(id).files[0];if(!f)return;if(f.size>2000000)throw new Error("file too large");const v=JSON.parse(await f.text());if(id==="hybrid")newSource({kind:"hybrid",project:v});else if(confirm("Replace current network?"))attempt(()=>validateJunction(v));}catch(e){say(e.message);}finally{$(id).value="";}});
function save(name,data){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
$("export").addEventListener("click",()=>save("phi-junction.json",p));
$("report").addEventListener("click",()=>save("phi-junction-report.json",{project:p,metrics:result.metrics,warnings:result.warnings}));
mountVault({kind:"hybrid",load:value=>render(createJunction({kind:"hybrid",project:value}))});render(createJunction({kind:"pattern",pattern:"golden-branch",parameters:{size:100}}));
