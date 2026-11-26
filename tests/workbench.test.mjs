import test from "node:test";
import assert from "node:assert/strict";
import {names,generate,toSvg,validate} from "../workbench/geometry.mjs";
test("all nine at parameter extremes",()=>{assert.equal(new Set(names).size,9);
 for(const name of names)for(const p of [{},{size:10,strands:2,turns:1,depth:1,ratio:.35,cells:1},{size:1000,strands:9,turns:9,depth:5,ratio:.75,cells:6}]){
 const m=generate(name,p);assert.ok(m.metrics.centerline_length_mm>0);assert.ok(m.paths.length>0);
 for(const l of m.paths)for(const v of l.flat())assert.ok(Number.isFinite(v)&&v>=0&&v<=100,name+" "+v);
 assert.deepEqual(generate(name,p),m);assert.match(toSvg(m),/^<svg /);
 }});
test("scale proportionality",()=>{for(const name of names){const a=generate(name,{size:100}).metrics.centerline_length_mm,b=generate(name,{size:200}).metrics.centerline_length_mm;assert.ok(Math.abs(2*a-b)<.002);}});
test("invalid parameters rejected",()=>{for(const p of [{size:NaN},{depth:99},{ratio:Infinity},{cells:1.5},{strands:0},{size:"100"}])assert.throws(()=>validate(p));assert.throws(()=>generate("unknown"));});
test("controls change geometry",()=>{assert.notDeepEqual(generate("tri-braid",{strands:3}).paths,generate("tri-braid",{strands:6}).paths);assert.notDeepEqual(generate("golden-branch",{ratio:.4}).paths,generate("golden-branch",{ratio:.7}).paths);assert.notDeepEqual(generate("pocket-mesh",{cells:2}).paths,generate("pocket-mesh",{cells:3}).paths);});
