import {validateProject} from "./garment.mjs";
import {importProject,exportProject} from "./hybrid.mjs";
import {validateLab} from "./laboratory.mjs";
export const KEY="copperphiwear.vault.v1";
export const kinds=Object.freeze(["garment","hybrid","laboratory"]);
export const MAX_CHARS=2000000,MAX_RECORDS=100;
const empty=()=>({version:1,records:[]});
const assertSize=value=>{const raw=JSON.stringify(value);if(typeof raw!=="string"||raw.length>MAX_CHARS)throw new RangeError("vault size limit");return raw;};
const label=x=>{if(typeof x!=="string"||!x.trim()||x.length>100)throw new RangeError("snapshot name");return x.trim();};
const id=x=>{if(typeof x!=="string"||!/^[A-Za-z0-9_-]{1,80}$/.test(x))throw new RangeError("snapshot ID");return x;};
export function payload(kind,value){
 assertSize(value);
 if(kind==="garment")return validateProject(value);
 if(kind==="hybrid")return exportProject(importProject(value));
 if(kind==="laboratory")return validateLab(value);
 throw new RangeError("unsupported project type");
}
export function validateVault(input){
 assertSize(input);
 if(!input||input.version!==1||!Array.isArray(input.records)||input.records.length>MAX_RECORDS)throw new RangeError("vault version or capacity");
 const seen=new Set(),records=input.records.map(r=>{
  if(!r)throw new RangeError("record");
  const key=id(r.id);if(seen.has(key))throw new RangeError("duplicate snapshot ID");seen.add(key);
  if(typeof r.createdAt!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(r.createdAt)||!Number.isFinite(Date.parse(r.createdAt))||new Date(r.createdAt).toISOString()!==r.createdAt)throw new RangeError("snapshot timestamp");
  return {id:key,name:label(r.name),kind:r.kind,createdAt:r.createdAt,data:payload(r.kind,r.data)};
 });
 const result={version:1,records};assertSize(result);return result;
}
export function readVault(storage){const raw=storage.getItem(KEY);if(raw===null)return empty();if(raw.length>MAX_CHARS)throw new RangeError("vault size limit");return validateVault(JSON.parse(raw));}
function write(storage,value){const next=validateVault(value);storage.setItem(KEY,assertSize(next));return next;}
export function appendSnapshot(storage,record){const old=readVault(storage);return write(storage,{version:1,records:[...old.records,record]});}
export function removeSnapshot(storage,key){const old=readVault(storage);if(!old.records.some(r=>r.id===key))throw new RangeError("snapshot not found");return write(storage,{version:1,records:old.records.filter(r=>r.id!==key)});}
export function mergeBackup(storage,backup){
 const incoming=validateVault(backup),old=readVault(storage),map=new Map(old.records.map(r=>[r.id,r]));
 for(const r of incoming.records){if(map.has(r.id)&&JSON.stringify(map.get(r.id))!==JSON.stringify(r))throw new RangeError("conflicting snapshot ID; no changes made");map.set(r.id,r);}
 return write(storage,{version:1,records:[...map.values()]});
}
export function newRecord(kind,name,data){return {id:crypto.randomUUID(),name,kind,createdAt:new Date().toISOString(),data:payload(kind,data)};}
// Serialize writes across cooperating same-origin tabs when supported. Otherwise fail closed.
export async function locked(action){if(!navigator.locks?.request)throw new Error("Browser Web Locks unavailable; use individual JSON exports instead.");return navigator.locks.request(KEY,()=>action());}
