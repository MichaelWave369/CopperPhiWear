import math
import unittest
from xml.etree import ElementTree as ET
from tools.patterns import NAMES, pattern, render

class Patterns(unittest.TestCase):
    def test_all_nine(self):
        self.assertEqual(len(set(NAMES)),9)
        for name in NAMES:
            with self.subTest(name=name):
                paths=pattern(name)
                self.assertTrue(paths)
                for p in paths:
                    self.assertGreaterEqual(len(p),2)
                    for x,y in p:
                        self.assertTrue(math.isfinite(x) and math.isfinite(y))
                        self.assertTrue(0<=x<=100 and 0<=y<=100,(name,x,y))
                svg,m=render(name)
                self.assertEqual(len(ET.fromstring(svg).findall("{http://www.w3.org/2000/svg}polyline")),len(paths))
                self.assertGreater(m["centerline_length_mm"],0)
                self.assertEqual(render(name),(svg,m))
                self.assertAlmostEqual(render(name,200)[1]["centerline_length_mm"],2*m["centerline_length_mm"],delta=0.002)
    def test_invalid(self):
        for size in (0,-1,float("nan"),float("inf"),1001):
            with self.assertRaises(ValueError): render("spiral",size)
        with self.assertRaises(ValueError): pattern("invalid")
