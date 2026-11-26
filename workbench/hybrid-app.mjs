import {presets,preset,compile,hybridSvg,exportProject,importProject} from "./hybrid.mjs";
const $=id=>document.getElementById(id);let model=null;
for(const p of presets){const o=document.createElement("option");o.value=p;o.textContent=p;$("preset").append(o);}
function clear(){model=null;$("preview").replaceChildren();$("metrics").textContent="";$("svg").disabled=true;$("json").disabled=true;}
function show(m){model=m;$("preview").innerHTML=hybridSvg(m);$("metrics").textContent=JSON.stringify(m.metrics,null,2);$("svg").disabled=false;$("json").disabled=false;$("status").textContent="Composition compiled. Geometry only.";}
function run(){clear();try{if($("tree").value.length>500000)throw new RangeError("editor capacity");show(compile(JSON.parse($("tree").value),{size:$("size").valueAsNumber,resolution:$("resolution").valueAsNumber}));}catch(e){$("status").textContent=e.message;}}
function load(){clear();try{$("tree").value=JSON.stringify(preset($("preset").value,$("depth").valueAsNumber),null,2);run();}catch(e){$("status").textContent=e.message;}}
$("load").addEventListener("click",load);$("compile").addEventListener("click",run);
for(const id of ["tree","size","resolution"])$(id).addEventListener("input",()=>{clear();$("status").textContent="Edits not yet compiled.";});
function save(name,data,mime){const url=URL.createObjectURL(new Blob([data],{type:mime}));const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("svg").addEventListener("click",()=>{if(model)save("phi-hybrid.svg",hybridSvg(model),"image/svg+xml");});
$("json").addEventListener("click",()=>{if(model)save("phi-hybrid.json",JSON.stringify(exportProject(model),null,2),"application/json");});
$("import").addEventListener("change",async()=>{try{const f=$("import").files[0];if(!f)return;if(f.size>500000)throw new RangeError("project too large");const m=importProject(JSON.parse(await f.text()));$("tree").value=JSON.stringify(m.tree,null,2);$("size").value=m.metrics.size_mm;$("resolution").value=m.metrics.grid_resolution;show(m);}catch(e){$("status").textContent="Import rejected: "+e.message;}finally{$("import").value="";}});load();
