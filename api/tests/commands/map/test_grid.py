import os
import unittest

from api.commands.map import grid


class GridTest(unittest.TestCase):
    os.environ['IS_TEST'] = 'true'

    def test_apply_grid(self):
        url = 'https://i.pinimg.com/736x/ee/85/5d/ee855d7efa22f163fcd6f24560ce7128.jpg'
        grid.apply_grid(url, 28, 20)
        self.assertTrue(os.path.isfile("map.png"))
        self.assertFalse(os.path.isfile("downloaded.jpg"))
        os.remove("map.png")

    def test_column_string(self):
        self.assertEqual(grid.column_string(28), 'AB')
        self.assertEqual(grid.column_string(702), 'ZZ')

    def test_find_font_size(self):
        font = grid.find_font_size('text', max_width=50, max_height=30)
        self.assertEqual(font.size, 31)


if __name__ == '__main__':
    unittest.main()
