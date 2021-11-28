import os
import operator
import string
from typing import List, Tuple

from flask import current_app
from PIL import Image, ImageDraw, ImageFont
import requests

from commands.map.Token import Token, size
from commands.map import storage
from commands.constants import BUCKET
from configuration import FONT_DIR


def download_image(image_url: str) -> str:
    try:
        response = requests.get(image_url)
        if response.status_code >= 400:
            current_app.logger.warn("Url {0} returned status code {1}".format(
                image_url, response.status_code))
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
        current_app.logger.warn("Could not find image: {0}".format(exception))
        return ""


def download_s3_image(object: str) -> str:
    file_name = 'downloaded.png'
    if os.getenv('IS_TEST', 'false') == 'false':
        file_name = '/tmp/' + file_name
    successful = storage.download_blob(BUCKET, object, file_name)

    if successful:
        return file_name
    else:
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

    try:
        font = ImageFont.truetype(font_path, font_height)
        while font.getsize(text)[0] < max_width and font.getsize(text)[1] < max_height:
            font_height += 1
            font = ImageFont.truetype(font_path, font_height)
    except OSError as oe:
        current_app.logger.warn(oe)
        font = ImageFont.load_default()

    return font


def place_tiny_token(no_on_square: int, coordinates: Tuple[float, float, float, float]):
    x0, y0, x1, y1 = coordinates

    if no_on_square % 4 == 1:
        return x0, y0, (x0 + x1) / 2, (y0 + y1) / 2
    elif no_on_square % 4 == 2:
        return (x0 + x1) / 2, y0, x1, (y0 + y1) / 2
    elif no_on_square % 4 == 3:
        return x0, (y0 + y1) / 2, (x0 + x1) / 2, y1
    else:
        return (x0 + x1) / 2, (y0 + y1) / 2, x1, y1


def create_grid(image_url: str, rows: int, cols: int):
    image_name = download_image(image_url)
    if image_name == '':
        return None

    file_name = 'map.png'
    line_colour = (0xff, 0xff, 0xff, 0xaa)

    with Image.open(image_name).convert('RGBA') as im:
        col_width = im.size[0] / cols
        row_height = im.size[1] / rows

        margin_x = int(col_width)
        margin_y = int(row_height)

        frame = Image.new('RGBA', tuple(
            map(operator.add, im.size, (margin_x, margin_y))), (0xff, 0xff, 0xff))

        map_draw = ImageDraw.Draw(im)
        frame_draw = ImageDraw.Draw(frame)

        reverse_row_values = range(rows, 0, -1)
        row_font = find_font_size(str(reverse_row_values[0]), int(
            margin_x * 0.8), int(margin_y * 0.8))
        col_font = find_font_size(column_string(cols), int(
            margin_x * 0.8), int(margin_y * 0.8))

        for i in range(0, rows):
            y = (i + 1) * row_height
            map_draw.line([0, y, im.size[0], y], fill=line_colour)

            label = str(reverse_row_values[i])
            y_label = y - (row_height / 2)
            frame_draw.text((margin_x / 2, y_label), label,
                            font=row_font, fill='black', anchor='mm')

        for j in range(0, cols):
            x = (j + 1) * col_width
            map_draw.line([x, 0, x, im.size[1]], fill=line_colour)

            label = column_string(j + 1)
            x_label = x - (col_width / 2) + margin_x
            frame_draw.text(
                (x_label, im.size[1] + margin_y / 2), label, font=col_font, fill='black', anchor='mm')

        frame.paste(im, (int(col_width), 0))
        frame.save(file_name, 'PNG')

    delete_image(image_name)
    return file_name, margin_x, margin_y


def apply_tokens(base_map_object: str, margin_x: int, margin_y: int, tokens: List[Token]):
    image_name = download_s3_image(base_map_object)
    if image_name == '':
        return None

    file_name = 'map.png'

    with Image.open(image_name).convert('RGBA') as im:
        token_layer = Image.new('RGBA', tuple(
            map(operator.sub, im.size, (margin_x, margin_y))), (0, 0, 0, 0))
        token_draw = ImageDraw.Draw(token_layer)

        # Up to 4 Tiny tokens can occupy a single square, so we need to track how many we have to know where to put them
        tiny_tokens = {}

        for token in tokens:
            row = token.row
            col = column_number(token.column)

            token_text = token.name[:1]
            token_size = float(token.size)
            token_font = find_font_size(token_text,
                                        max_width=(
                                            margin_x * token_size * 0.7),
                                        max_height=(margin_y * token_size * 0.7))

            if token_size == size['TINY']:
                key = '{}{}'.format(token.column, token.row)
                current = tiny_tokens.get(key, 0)
                tiny_tokens[key] = current + 1

                x0, y0, x1, y1 = place_tiny_token(tiny_tokens[key], ((col - 1) * margin_x,
                                                                     im.size[1] -
                                                                     ((row + 1)
                                                                      * margin_y),
                                                                     col * margin_x,
                                                                     im.size[1] - (row * margin_y)))
            else:
                x0 = (col - 1) * margin_x
                x1 = (col - 1 + token_size) * margin_x

                y1 = int(im.size[1] - (row * margin_y))
                y0 = y1 - token_size * margin_y

            tx = ((x0 + x1) / 2)
            ty = ((y0 + y1) / 2)

            token_draw.ellipse([x0, y0, x1, y1], fill=token.colour)

            # Text with border
            token_draw.text((tx - 1, ty), token_text,
                            font=token_font, fill='black', anchor='mm')
            token_draw.text((tx + 1, ty), token_text,
                            font=token_font, fill='black', anchor='mm')
            token_draw.text((tx, ty - 1), token_text,
                            font=token_font, fill='black', anchor='mm')
            token_draw.text((tx, ty + 1), token_text,
                            font=token_font, fill='black', anchor='mm')

            token_draw.text((tx, ty), token_text,
                            font=token_font, fill='white', anchor='mm')

        # This uses the mask option to paste the transparent token layer over the base image
        im.paste(token_layer, (int(margin_x), 0), token_layer)
        im.save(file_name, 'PNG')

    delete_image(image_name)
    return file_name
