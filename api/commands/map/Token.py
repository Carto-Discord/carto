size = {
    'TINY': 0.5,
    'SMALL': 1,
    'MEDIUM': 1,
    'LARGE': 2,
    'HUGE': 3,
    'GARGANTUAN': 4
}


class Token:
    def __init__(self, name: str, row: int, column: str, colour: str, size: float):
        self.name = name
        self.row = row
        self.column = column
        self.colour = colour
        self.size = size
