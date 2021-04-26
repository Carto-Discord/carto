import os
import unittest

from api.commands.map import grid, Token


class GridTest(unittest.TestCase):
    os.environ['IS_TEST'] = 'true'

    def test_apply_grid(self):
        url = 'https://i.pinimg.com/736x/ee/85/5d/ee855d7efa22f163fcd6f24560ce7128.jpg'
        tokens = [
            Token.Token(name='atoken', row=11, column='G', colour='white', size=Token.size['LARGE']),
            Token.Token(name='btoken', row=17, column='A', colour='red', size=Token.size['MEDIUM']),
            Token.Token(name='ctoken', row=3, column='C', colour='blue', size=Token.size['TINY']),
            Token.Token(name='dtoken', row=3, column='C', colour='white', size=Token.size['TINY']),
            Token.Token(name='etoken', row=3, column='C', colour='red', size=Token.size['TINY']),
            Token.Token(name='ftoken', row=3, column='C', colour='purple', size=Token.size['TINY']),
            Token.Token(name='gtoken', row=3, column='C', colour='purple', size=Token.size['TINY'])
        ]
        grid.apply_grid(url, 28, 20, tokens=tokens)
        self.assertTrue(os.path.isfile("map.png"))
        self.assertFalse(os.path.isfile("downloaded.jpg"))
        os.remove("map.png")

    def test_column_string(self):
        self.assertEqual(grid.column_string(28), 'AB')
        self.assertEqual(grid.column_string(702), 'ZZ')

    def test_column_number(self):
        self.assertEqual(grid.column_number("A"), 1)
        self.assertEqual(grid.column_number("AB"), 28)
        self.assertEqual(grid.column_number("ZZ"), 702)

    def test_find_font_size(self):
        font = grid.find_font_size('text', max_width=50, max_height=30)
        self.assertEqual(font.size, 31)


if __name__ == '__main__':
    unittest.main()
