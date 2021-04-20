import math
import os
import operator
import logging

from PIL import Image, ImageDraw, ImageFont
import requests


def download_image(image_url: str) -> str:
    try:
        response = requests.get(image_url)
        if response.status_code >= 400:
            logging.log(level=logging.WARN,
                        msg="Url {0} returned status code {1}".format(image_url, response.status_code))
            return ""

        file_name = 'downloaded.' + image_url.split('/')[-1].split('.')[-1]
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
    string = ""
    while n > 0:
        n, remainder = divmod(n - 1, 26)
        string = chr(65 + remainder) + string
    return string


def apply_grid(image_url: str, rows: int, cols: int):
    image_name = download_image(image_url)
    if image_name == '':
        return None

    file_name = 'map.png'
    margin_top = 20
    margin_left = 10 + math.floor(math.log(rows, 10)) * 10
    font_height = 12
    line_colour = (0xff, 0xff, 0xff)

    with Image.open(image_name) as im:
        frame = Image.new('RGB', tuple(map(operator.add, im.size, (margin_left, margin_top))), (0xff, 0xff, 0xff))

        map_draw = ImageDraw.Draw(im)
        frame_draw = ImageDraw.Draw(frame)

        try:
            font = ImageFont.truetype("arial.ttf", font_height)
        except OSError:
            font = ImageFont.load_default()

        col_width = im.size[0] / cols
        row_height = im.size[1] / rows

        reverse_row_values = range(rows, 0, -1)
        for i in range(0, rows):
            y = (i + 1) * row_height
            map_draw.line([0, y, im.size[0], y], line_colour)

            label = str(reverse_row_values[i])
            w, h = font.getsize(label)
            y_label = y - (row_height / 2) - (h / 2)
            frame_draw.text((margin_left / 2 - w / 2, y_label), label, font=font, fill=0)

        for j in range(0, cols):
            x = (j + 1) * col_width
            map_draw.line([x, 0, x, im.size[1]], line_colour)

            label = column_string(j + 1)
            w, h = font.getsize(label)
            x_label = x - (col_width / 2) + margin_top - (w / 2)
            frame_draw.text((x_label, im.size[1] + margin_top / 2 - h / 2), label, font=font, fill=0)

        frame.paste(im, (margin_left, 0))

        if os.getenv('IS_TEST', 'false') == 'false':
            file_name = '/tmp/' + file_name

        frame.save(file_name, 'PNG')

    delete_image(image_name)
    return file_name
