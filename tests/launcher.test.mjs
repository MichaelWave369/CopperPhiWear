import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
test("launcher links all eight browser tools and styles",()=>{const html=readFileSync("index.html","utf8");for(const name of ["index","textile","garment","fabrication","laboratory","optimize","hybrid","wear"]){const p="workbench/"+name+".html";assert.ok(html.includes('href="'+p+'"'));assert.ok(existsSync(p));}assert.ok(existsSync("workbench/style.css"));});
