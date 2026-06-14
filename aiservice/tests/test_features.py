import unittest

from app.features import (
    compute_age_years,
    merge_text,
    normalize_region,
    parse_storage_gb,
    parse_xgb_base_score,
    round_ram,
)


class FeatureTests(unittest.TestCase):
    def test_normalize_region(self):
        self.assertEqual(normalize_region("TP. Hồ Chí Minh"), "HCM")
        self.assertEqual(normalize_region("Hà Nội"), "HN")
        self.assertEqual(normalize_region(None), "Khác")

    def test_parse_storage(self):
        self.assertEqual(parse_storage_gb("128GB"), 128.0)
        self.assertEqual(parse_storage_gb("1TB"), 1024.0)
        self.assertEqual(parse_storage_gb(256), 256.0)

    def test_round_ram(self):
        self.assertEqual(round_ram(7.5), 8.0)
        self.assertEqual(round_ram(3.2), 3.0)

    def test_compute_age(self):
        age, known = compute_age_years(2023, title="iphone 13", description="")
        self.assertEqual(known, 1)
        self.assertGreaterEqual(age, 0)

    def test_parse_xgb_base_score(self):
        self.assertAlmostEqual(parse_xgb_base_score("5E-1"), 0.5)
        self.assertAlmostEqual(parse_xgb_base_score("[1.5559938E1]"), 15.559938, places=4)
        self.assertAlmostEqual(parse_xgb_base_score(15.56), 15.56)

    def test_merge_text(self):
        self.assertIn("pin 92%", merge_text("iphone zin", "pin 92%"))


if __name__ == "__main__":
    unittest.main()
