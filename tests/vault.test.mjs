import test from "node:test";
import assert from "node:assert/strict";
import {KEY,readVault,appendSnapshot,removeSnapshot,mergeBackup,validateVault} from "../workbench/vault.mjs";
import {blankProject} from "../workbench/garment.mjs";
import {blankLab} from "../workbench/laboratory.mjs";
import {compile,preset,exportProject} from "../workbench/hybrid.mjs";
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
const record=(id,kind,data)=>({id,kind,data,name:"Test "+id,createdAt:"2026-01-01T00:00:00.000Z"});
test("three module schemas survive independent reload and portable merge",()=>{const s=storage(),t=storage();assert.equal(readVault(s).records.length,0);for(const r of [record("a","garment",blankProject()),record("b","laboratory",blankLab()),record("c","hybrid",exportProject(compile(preset("pocket-recursion"))))])appendSnapshot(s,r);const v=readVault(s);assert.equal(v.records.length,3);assert.deepEqual(mergeBackup(t,JSON.parse(JSON.stringify(v))),v);assert.deepEqual(mergeBackup(t,v),v);assert.equal(removeSnapshot(t,"a").records.length,2);assert.equal(readVault(s).records.length,3);});
test("invalid payloads, collisions and corrupted storage fail without writes",()=>{const s=storage(),r=record("a","garment",blankProject());appendSnapshot(s,r);const before=s.getItem(KEY);assert.throws(()=>appendSnapshot(s,r));assert.throws(()=>mergeBackup(s,{version:1,records:[{...r,name:"other"}]}));assert.throws(()=>appendSnapshot(s,record("b","laboratory",{})));assert.equal(s.getItem(KEY),before);s.setItem(KEY,"broken");assert.throws(()=>appendSnapshot(s,r));assert.equal(s.getItem(KEY),"broken");});
test("quota errors propagate; size and timestamps validated",()=>{const s=storage();s.setItem=()=>{throw new Error("quota");};assert.throws(()=>appendSnapshot(s,record("a","garment",blankProject())),/quota/);assert.throws(()=>validateVault({version:1,records:[{...record("a","laboratory",blankLab()),createdAt:"yesterday"}]}));assert.throws(()=>validateVault({version:1,records:[],extra:"x".repeat(2000001)}));});
