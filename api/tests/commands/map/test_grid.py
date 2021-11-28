import os
from shutil import copyfile
import unittest
from unittest.mock import patch

from flask import Flask

from api.commands.map import grid, Token

__location__ = os.path.realpath(
    os.path.join(os.getcwd(), os.path.dirname(__file__)))


class GridTest(unittest.TestCase):
    os.environ['IS_TEST'] = 'true'
    app = Flask(__name__)

    def test_create_grid(self):
        url = 'https://i.pinimg.com/736x/ee/85/5d/ee855d7efa22f163fcd6f24560ce7128.jpg'
        with self.app.app_context():
            grid.create_grid(url, 28, 20)

        self.assertTrue(os.path.isfile("map.png"))
        self.assertFalse(os.path.isfile("downloaded.jpg"))
        os.remove("map.png")

    @patch('commands.map.storage.download_blob')
    def test_apply_tokens(self, mock_download_blob):
        # Mock downloading the file
        original_file = os.path.join(__location__, 'test_map.png')
        new_file = 'downloaded.png'
        copyfile(original_file, new_file)

        mock_download_blob.return_value = True

        tokens = [
            Token.Token(name='atoken', row=11, column='G',
                        colour='white', size=Token.size['LARGE']),
            Token.Token(name='btoken', row=17, column='A',
                        colour='red', size=Token.size['MEDIUM']),
            Token.Token(name='ctoken', row=3, column='C',
                        colour='blue', size=Token.size['TINY']),
            Token.Token(name='dtoken', row=3, column='C',
                        colour='white', size=Token.size['TINY']),
            Token.Token(name='etoken', row=3, column='C',
                        colour='red', size=Token.size['TINY']),
            Token.Token(name='ftoken', row=3, column='C',
                        colour='purple', size=Token.size['TINY']),
            Token.Token(name='gtoken', row=3, column='C',
                        colour='purple', size=Token.size['TINY'])
        ]

        with self.app.app_context():
            grid.apply_tokens('base.url', 32, 32, tokens)

        self.assertTrue(os.path.isfile("map.png"))
        self.assertFalse(os.path.isfile("downloaded.jpg"))
        # os.remove("map.png")

    def test_column_string(self):
        self.assertEqual(grid.column_string(28), 'AB')
        self.assertEqual(grid.column_string(702), 'ZZ')

    def test_column_number(self):
        self.assertEqual(grid.column_number("A"), 1)
        self.assertEqual(grid.column_number("AB"), 28)
        self.assertEqual(grid.column_number("ZZ"), 702)

    def test_find_font_size(self):
        with self.app.app_context():
            font = grid.find_font_size('text', max_width=50, max_height=30)

        self.assertEqual(28, font.size)


if __name__ == '__main__':
    unittest.main()
