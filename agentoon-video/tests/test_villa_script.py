"""Free checks for blender/villa_development.py using a stubbed Blender API.
Catches Python errors and checks camera, car and gate math. It does NOT prove the render looks right:
render stills in real Blender (see the script header) for that.
Run: python3 tests/test_villa_script.py
"""
import importlib.util
import math
import os
import sys
import unittest
from unittest.mock import MagicMock

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "..", "blender", "villa_development.py")

bpy = MagicMock(name="bpy")
sys.modules["bpy"] = bpy
sys.modules["bmesh"] = MagicMock(name="bmesh")
spec = importlib.util.spec_from_file_location("villa", SCRIPT)
villa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(villa)


class Math(unittest.TestCase):
    def test_aim_faces_target(self):
        # camera south of target looking north: no yaw, horizontal
        e = villa.aim((0, -10, 0), (0, 0, 0))
        self.assertAlmostEqual(e[0], math.pi / 2)
        self.assertAlmostEqual(e[2], 0.0)
        # camera west of target looks east (+X): yaw -90 degrees
        self.assertAlmostEqual(villa.aim((-10, 0, 0), (0, 0, 0))[2], -math.pi / 2)
        # camera above looks down: pitch below 90 degrees
        self.assertLess(villa.aim((0, -10, 10), (0, 0, 0))[0], math.pi / 2)

    def test_yaw_for_faces_motion(self):
        self.assertAlmostEqual(villa.yaw_for(0, 1), 0.0)           # +Y
        self.assertAlmostEqual(villa.yaw_for(1, 0), -math.pi / 2)  # +X

    def test_car_path_endpoints_and_smoothness(self):
        pts = villa.chaikin(villa.CAR_PATH, 3)
        self.assertEqual(pts[0], villa.CAR_PATH[0])
        self.assertEqual(pts[-1], villa.CAR_PATH[-1])
        total = villa.path_length(pts)
        self.assertGreater(total, 30)
        start, _ = villa.point_at(pts, 0)
        end, _ = villa.point_at(pts, total)
        self.assertEqual(start, villa.CAR_PATH[0])
        self.assertAlmostEqual(end[0], villa.CAR_PATH[-1][0])
        # no jumps: step between keyed frames stays under 4 m (about 12 m/s peak is fine for a short promo)
        prev = None
        for f in list(range(villa.CAR_F0, villa.CAR_F1, 4)) + [villa.CAR_F1]:
            p, _ = villa.point_at(pts, villa.car_dist(f, total))
            if prev:
                self.assertLess(math.hypot(p[0] - prev[0], p[1] - prev[1]), 4.0)
            prev = p

    def test_gate_is_open_before_the_car_reaches_it(self):
        pts = villa.chaikin(villa.CAR_PATH, 3)
        total = villa.path_length(pts)
        arrive = next(f for f in range(villa.E0, villa.E1 + 1)
                      if villa.point_at(pts, villa.car_dist(f, total))[0][1] >= -30.3)
        self.assertGreater(arrive, villa.E0 + 24, "car would hit the closed gate")

    def test_car_starts_outside_the_wall_and_stops_in_the_forecourt(self):
        self.assertLess(villa.CAR_PATH[0][1], -30.3)       # outside the south wall
        self.assertTrue(-24 < villa.CAR_PATH[-1][0] < -8)  # forecourt in front of villa A
        self.assertTrue(-9 < villa.CAR_PATH[-1][1] < -4)

    def test_beats_are_contiguous(self):
        beats = [(villa.A0, villa.A1), (villa.B0, villa.B1), (villa.C0, villa.C1),
                 (villa.D0, villa.D1), (villa.E0, villa.E1), (villa.F0, villa.F1)]
        for (a0, a1), (b0, b1) in zip(beats, beats[1:]):
            self.assertEqual(a1 + 1, b0)
        self.assertEqual(beats[-1][1], 720)

    def test_windows_never_overlap(self):
        for a, b, n, w in ((10, 14.4, 2, 2.4), (-23, -17.6, 2, 2.4), (17.6, 22, 2, 2.4), (-23.5, -8.5, 4, 2.2)):
            ws = villa.evenly(a, b, n, w, 0.9, 2.5)
            for (_, x1, *_), (x0, *_) in zip(ws, ws[1:]):
                self.assertLessEqual(x1, x0)

    def test_pool_hole_clear_of_villas(self):
        x0, x1, y0, y1 = villa.HOLE
        self.assertLess(-16 + 8 + 0.5, x0)  # villa A east foundation edge
        self.assertGreater(16 - 7 - 0.5, x1)  # villa B west foundation edge


class Build(unittest.TestCase):
    def test_full_build_runs_without_python_errors(self):
        villa.build()
        self.assertGreater(bpy.data.objects.new.call_count, 400)
        self.assertGreater(bpy.data.cameras.new.call_count, 5)
        self.assertEqual(villa.S.timeline_markers.new.call_count, 6)
        marker_frames = sorted(c.kwargs["frame"] for c in villa.S.timeline_markers.new.call_args_list)
        self.assertEqual(marker_frames, [1, 97, 241, 361, 457, 553])

    def test_parse_args(self):
        sys.argv = ["blender", "-b", "-P", "x.py", "--", "--stills", "out/s", "--samples", "8", "--video", "v.mp4"]
        o = villa.parse_args()
        self.assertEqual((o["stills"], o["video"], o["samples"]), ("out/s", "v.mp4", 8))


if __name__ == "__main__":
    unittest.main(verbosity=2)
