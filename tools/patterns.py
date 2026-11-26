"""Generate conceptual textile centerlines, not fabrication-ready wiring."""
import argparse
import json
import math
from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, tostring

NAMES = ("tri-braid", "hex-braid", "golden-branch", "mycelium", "pocket-mesh",
         "hex-mesh", "spiral", "fractal-braid", "phi-hybrid")
# Coordinate domain is a normalized 100 x 100 concept tile.
def braid(n):
    return [[(50 + 25*math.sin(t*math.pi/20+2*math.pi*k/n), 5+90*t/80)
             for t in range(81)] for k in range(n)]

def squares():
    return [[(x-r,y-r),(x+r,y-r),(x+r,y+r),(x-r,y+r),(x-r,y-r)]
            for x in (25,75) for y in (25,75) for r in (8,18)]

def honeycomb():
    return [[(x+9*math.cos(k*math.pi/3), y+9*math.sin(k*math.pi/3))
             for k in range(7)] for x in (20,47,74) for y in (20,36,52,68,84)]

def branches(depth, ratio, angle):
    paths=[]
    def grow(x,y,length,a,d):
        u,v=x+length*math.cos(a),y+length*math.sin(a)
        paths.append([(x,y),(u,v)])
        if d:
            for delta in (-angle,angle):
                grow(u,v,length*ratio,a+delta,d-1)
    grow(50,92,30,-math.pi/2,depth)
    return paths

def pattern(name):
    if name=="tri-braid": return braid(3)
    if name=="hex-braid": return braid(6)
    if name=="golden-branch": return branches(3, (math.sqrt(5)-1)/2, 0.55)
    if name=="mycelium":
        p=branches(3,0.65,0.8)
        # Cross-links between adjacent endpoints only; no connectivity assertion.
        tips=[q[-1] for q in p]
        return p+[[(a[0],a[1]),(b[0],b[1])] for a,b in zip(tips,tips[1:]) if math.dist(a,b)<15]
    if name=="pocket-mesh": return squares()
    if name=="hex-mesh": return honeycomb()
    if name=="spiral":
        return [[(50+(3+40*t/240)*math.cos(t*math.pi/40),
                  50+(3+40*t/240)*math.sin(t*math.pi/40)) for t in range(241)]]
    if name=="fractal-braid":
        return [[(x+s*u/100,y+s*v/100) for u,v in line]
                for x,y,s in ((30,5,40),(5,45,40),(55,45,40)) for line in braid(3)]
    if name=="phi-hybrid":
        return [[(x+s*u/100,y+s*v/100) for u,v in line]
                for x,y,s,group in ((0,0,50,braid(3)),(50,0,50,squares()),
                                    (25,50,50,honeycomb())) for line in group]
    raise ValueError("unknown pattern")

def render(name, size=100.0):
    if not math.isfinite(size) or not 10<=size<=1000:
        raise ValueError("size must be finite and between 10 and 1000 mm")
    paths=pattern(name)
    root=Element("svg", xmlns="http://www.w3.org/2000/svg",
                 width=f"{size}mm", height=f"{size}mm", viewBox="0 0 100 100")
    SubElement(root,"title").text=name+" (concept; crossings unspecified)"
    for path in paths:
        SubElement(root,"polyline",points=" ".join(f"{x:.5f},{y:.5f}" for x,y in path),
                   fill="none",stroke="#b87333", **{"stroke-width":"0.7"})
    length=sum(math.dist(a,b) for p in paths for a,b in zip(p,p[1:]))*size/100
    return tostring(root,encoding="unicode"), {"pattern":name,"tile_mm":size,
        "paths":len(paths),"centerline_length_mm":round(length,3),
        "crossings":"unspecified","metric":"geometric length including overlaps"}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--pattern",choices=(*NAMES,"all"),default="all")
    p.add_argument("--size-mm",type=float,default=100)
    p.add_argument("--out",type=Path,default=Path("output"))
    args=p.parse_args()
    if not math.isfinite(args.size_mm) or not 10<=args.size_mm<=1000:
        p.error("size must be finite and between 10 and 1000 mm")
    args.out.mkdir(parents=True,exist_ok=True)
    metrics=[]
    for name in NAMES if args.pattern=="all" else (args.pattern,):
        svg,summary=render(name,args.size_mm)
        (args.out/(name+".svg")).write_text(svg+"\n",encoding="utf-8")
        metrics.append(summary)
    (args.out/"metrics.json").write_text(json.dumps(metrics,indent=2)+"\n",encoding="utf-8")

if __name__=="__main__": main()
