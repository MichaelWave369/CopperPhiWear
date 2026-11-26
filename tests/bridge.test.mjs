import test from "node:test";
import assert from "node:assert/strict";
import {createBridge,validateBridge,addLink,removeRecord,analyzeBridge} from "../workbench/bridge.mjs";
import {blankProject} from "../workbench/garment.mjs";
import {blankLab} from "../workbench/laboratory.mjs";
import {compile,preset,exportProject} from "../workbench/hybrid.mjs";
const record=(id,kind,data)=>({id,name:id,kind,data,createdAt:"2026-01-01T00:00:00.000Z"});
function sample(){const g=blankProject();Object.assign(g.panels[0],{enabled:true,widthMm:300,heightMm:400});return createBridge({name:"Study",records:[record("g","garment",g),record("h","hybrid",exportProject(compile(preset("pocket-recursion")))),record("l","laboratory",blankLab())]});}
test("portable canonical manifest and derived reports",()=>{const p=sample(),q=validateBridge(JSON.parse(JSON.stringify(p)));assert.deepEqual(q,p);const r=analyzeBridge(q);assert.equal(r.records[0].derived.inventory.tile_quantity,6);assert.ok(r.records[1].derived.path_count>0);assert.equal(r.records[2].derived.recorded_readings,0);assert.equal(r.records[2].derived.registered_samples,0);});
test("typed links, duplicates, dangling references and safe removal",()=>{const p=sample(),l={kind:"design-context",from:"h",to:"g",note:"Inspiration only"};const q=addLink(p,l);assert.equal(q.links.length,1);assert.throws(()=>addLink(q,l));assert.throws(()=>addLink(q,{...l,to:"unknown"}));assert.throws(()=>addLink(q,{...l,from:"g",to:"h"}));assert.throws(()=>removeRecord(q,"h"));assert.equal(removeRecord(q,"l").records.length,2);assert.equal(p.links.length,0);});
test("captured copies remain independent and context is not evidence",()=>{const g=blankProject(),p=createBridge({name:"Copy",records:[record("g","garment",g),record("l","laboratory",blankLab())]});g.panels[0].enabled=true;assert.equal(p.records[0].data.panels[0].enabled,false);const q=addLink(p,{kind:"measurement-context",from:"g",to:"l",note:"Planned context"});assert.equal(analyzeBridge(q).records[1].derived.recorded_readings,0);assert.throws(()=>validateBridge({...q,version:2}));assert.throws(()=>createBridge({name:"",records:[]}));});
