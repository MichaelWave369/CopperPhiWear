import {names,defaults,ranges,applicable,generate,toSvg} from "./geometry.mjs";
const $=id=>document.getElementById(id);
const select=$("pattern");let p={...defaults},model;
for(const name of names){const o=document.createElement("option");o.value=name;o.textContent=name;select.append(o);}
function build(){const root=$("params");root.replaceChildren();for(const key of applicable[select.value]){
 const id="p-"+key,[min,max,step]=ranges[key],label=document.createElement("label"),out=document.createElement("output"),input=document.createElement("input");
 label.htmlFor=id;label.textContent=key==="size"?"Tile size (mm)":key;out.textContent=p[key];label.append(out);
 Object.assign(input,{id,type:"range",min,max:key==="depth"&&select.value==="fractal-braid"?3:max,step,value:p[key]});
 input.addEventListener("input",()=>{p[key]=Number(input.value);out.textContent=p[key];draw();});root.append(label,input);
 }draw();}
function draw(){model=generate(select.value,p);$("preview").innerHTML=toSvg(model);$("length").textContent=model.metrics.centerline_length_mm.toLocaleString()+" mm";$("count").textContent=model.metrics.path_count;$("note").textContent="Concept geometry only. Crossing connectivity is unspecified.";}
select.addEventListener("change",()=>{p={...defaults,strands:select.value==="hex-braid"?6:3};build();});
$("reset").addEventListener("click",()=>{p={...defaults,strands:select.value==="hex-braid"?6:3};build();});
function save(ext,body,mime){const url=URL.createObjectURL(new Blob([body],{type:mime}));const a=document.createElement("a");a.href=url;a.download=select.value+"."+ext;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("svg").addEventListener("click",()=>save("svg",toSvg(model),"image/svg+xml"));
$("json").addEventListener("click",()=>save("json",JSON.stringify(model.metrics,null,2),"application/json"));
build();
