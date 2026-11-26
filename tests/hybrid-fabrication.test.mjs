import test from "node:test";
import assert from "node:assert/strict";
import {compile,preset,presets,exportProject} from "../workbench/hybrid.mjs";
import {hybridSheet,hybridReference,fitsSheet,swatchSheet} from "../workbench/fabrication.mjs";
test("all hybrid presets preserve canonical tree, scale, metrics and point counts",()=>{
 for(const name of presets){
  const m=compile(preset(name),{size:120}),p=exportProject(m),r=hybridReference(p,"a4",3),s=hybridSheet(p,"a4");
  assert.deepEqual(r.project,p);assert.deepEqual(r.geometry,m.metrics);assert.equal(r.size_mm,120);assert.equal(r.printable,true);
  assert.equal(r.inventory.planned_centerline_mm,Math.round(m.metrics.centerline_length_mm*3000)/1000);
  assert.deepEqual(s.calibration_mm,[50,20]);assert.equal(s.geometry.path_count,m.paths.length);
  assert.equal((s.svg.match(/<polyline /g)||[]).length,m.paths.length);
  const actual=s.svg.match(/points="([^"]+)"/)[1].split(" ").map(q=>q.split(",").map(Number));
  for(let i=0;i<actual.length;i++){assert.ok(Math.abs(actual[i][0]-(45+m.paths[0][i][0]*1.2))<=.000501);assert.ok(Math.abs(actual[i][1]-(29+m.paths[0][i][1]*1.2))<=.000501);}
 }
});
test("oversized hybrid reference flagged without rescaling",()=>{const p=exportProject(compile(preset("braid-369"),{size:250}));const r=hybridReference(p);assert.equal(r.printable,false);assert.equal(r.project.size,250);assert.throws(()=>hybridSheet(p));assert.equal(fitsSheet(180,"letter"),true);assert.equal(fitsSheet(190,"a4"),false);});
test("invalid project, paper or quantity rejected; original fabrication remains intact",()=>{const p=exportProject(compile(preset("pocket-recursion")));assert.throws(()=>hybridReference(p,"bad"));assert.throws(()=>hybridReference(p,"letter",0));assert.throws(()=>hybridReference({}, "letter"));assert.equal(swatchSheet("spiral",100).size_mm,100);assert.equal(hybridReference(p).inventory.actual_yarn_mass_g,null);});
