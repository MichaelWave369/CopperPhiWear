import {readVault,appendSnapshot,newRecord,locked} from "./vault.mjs";
export function mountVault({kind,read,load}){
 const section=document.createElement("section"),h=document.createElement("h2"),name=document.createElement("input"),save=document.createElement("button"),select=document.createElement("select"),restore=document.createElement("button"),refresh=document.createElement("button"),status=document.createElement("p"),link=document.createElement("a");
 h.textContent="ΦVault local snapshots";name.placeholder="Snapshot name";name.maxLength=100;name.setAttribute("aria-label","Snapshot name");select.setAttribute("aria-label","Saved snapshot");status.setAttribute("role","status");
 for(const [b,t] of [[save,"Save new snapshot"],[restore,"Load selected snapshot"],[refresh,"Refresh list"]]){b.type="button";b.textContent=t;}
 link.href="vault.html";link.textContent="Manage backups in ΦVault";link.style.color="#dfaa80";
 section.append(h,name,save,select,restore,refresh,status,link);document.querySelector("main").append(section);
 function list(){select.replaceChildren();try{for(const r of readVault(localStorage).records.filter(r=>r.kind===kind)){const o=document.createElement("option");o.value=r.id;o.textContent=r.name+" · "+r.createdAt;select.append(o);}restore.disabled=!select.options.length;}catch(e){restore.disabled=true;status.textContent=e.message;}}
 refresh.addEventListener("click",list);
 save.disabled=typeof read!=="function";restore.hidden=typeof load!=="function";name.hidden=save.hidden=typeof read!=="function";
 save.addEventListener("click",async()=>{save.disabled=true;try{const record=newRecord(kind,name.value,read());await locked(()=>appendSnapshot(localStorage,record));status.textContent="Snapshot saved locally. Export a backup in ΦVault.";list();}catch(e){status.textContent="Save failed: "+e.message;}finally{save.disabled=false;}});
 restore.addEventListener("click",()=>{try{const r=readVault(localStorage).records.find(r=>r.id===select.value&&r.kind===kind);if(!r)throw new Error("Snapshot not found");if(!confirm("Load snapshot and replace current in-memory work? Export or save current work first."))return;load(r.data);status.textContent="Snapshot loaded.";}catch(e){status.textContent="Load failed: "+e.message;}});
 window.addEventListener("storage",list);list();
}
