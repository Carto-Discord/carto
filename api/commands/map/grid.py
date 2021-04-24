import os
import operator
import logging
import string
from typing import List

from PIL import Image, ImageDraw, ImageFont
import requests

from commands.map.Token import Token, size
from configuration import FONT_DIR


def download_image(image_url: str) -> str:
    try:
        response = requests.get(image_url)
        if response.status_code >= 400:
            logging.log(level=logging.WARN,
                        msg="Url {0} returned status code {1}".format(image_url, response.status_code))
            return ""

        extension = image_url.split('/')[-1].split('.')[-1]
        file_name = 'downloaded.' + extension[:extension.find('?')]
        if os.getenv('IS_TEST', 'false') == 'false':
            file_name = '/tmp/' + file_name
        file = open(file_name, 'wb')
        file.write(response.content)
        file.close()
        return file_name
    except requests.RequestException as exception:
        logging.log(level=logging.WARN, msg="Could not find image: {0}".format(exception))
        return ""


def delete_image(file_name: str):
    if os.path.exists(file_name):
        os.remove(file_name)


def column_string(n):
    s = ""
    while n > 0:
        n, remainder = divmod(n - 1, 26)
        s = chr(65 + remainder) + s
    return s


def column_number(col):
    num = 0
    for c in col:
        if c in string.ascii_letters:
            num = num * 26 + (ord(c.upper()) - ord('A')) + 1
    return num


def find_font_size(text, max_width, max_height):
    font_height = 1
    font_path = os.path.join(FONT_DIR, "arial.ttf")
    logging.log(level=logging.DEBUG, msg='Font located at ' + font_path)

    try:
        font = ImageFont.truetype(font_path, font_height)
        while font.getsize(text)[0] < max_width and font.getsize(text)[1] < max_height:
            font_height += 1
            font = ImageFont.truetype(font_path, font_height)
    except OSError as oe:
        logging.log(level=logging.WARN, msg=oe)
        font = ImageFont.load_default()

    return font


def apply_grid(image_url: str, rows: int, cols: int, tokens: List[Token] = None):
    image_name = download_image(image_url)
    if image_name == '':
        return None

    if tokens is None:
        tokens = []

    file_name = 'map.png'
    line_colour = (0xff, 0xff, 0xff, 0xaa)

    with Image.open(image_name).convert('RGBA') as im:
        col_width = im.size[0] / cols
        row_height = im.size[1] / rows

        margin_left = int(col_width)
        margin_top = int(row_height)

        frame = Image.new('RGBA', tuple(map(operator.add, im.size, (margin_left, margin_top))), (0xff, 0xff, 0xff))

        map_draw = ImageDraw.Draw(im)
        frame_draw = ImageDraw.Draw(frame)

        reverse_row_values = range(rows, 0, -1)
        row_font = find_font_size(str(reverse_row_values[0]), int(margin_left * 0.8), int(margin_top * 0.8))
        col_font = find_font_size(column_string(cols), int(margin_left * 0.8), int(margin_top * 0.8))

        for i in range(0, rows):
            y = (i + 1) * row_height
            map_draw.line([0, y, im.size[0], y], fill=line_colour)

            label = str(reverse_row_values[i])
            w, h = row_font.getsize(label)
            y_label = y - (row_height / 2) - (h / 2)
            frame_draw.text((margin_left / 2 - w / 2, y_label), label, font=row_font, fill=0)

        for j in range(0, cols):
            x = (j + 1) * col_width
            map_draw.line([x, 0, x, im.size[1]], fill=line_colour)

            label = column_string(j + 1)
            w, h = col_font.getsize(label)
            x_label = x - (col_width / 2) - (w / 2) + margin_left
            frame_draw.text((x_label, im.size[1] + margin_top / 2 - h / 2), label, font=col_font, fill=0)

        for token in tokens:
            row = token.row
            col = column_number(token.column)

            x0 = (col - token.size) * col_width
            x1 = col * col_width

            y0 = im.size[1] - (row * row_height)
            y1 = y0 + token.size * row_height

            map_draw.ellipse([x0, y0, x1, y1], fill=token.colour)

        frame.paste(im, (int(col_width), 0))

        if os.getenv('IS_TEST', 'false') == 'false':
            file_name = '/tmp/' + file_name

        frame.save(file_name, 'PNG')

    delete_image(image_name)
    return file_name
