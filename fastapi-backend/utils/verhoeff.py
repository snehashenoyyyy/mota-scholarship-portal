"""
Verhoeff checksum algorithm for validating Aadhaar-style 12-digit numbers.
"""

_D = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,2,3,4,0,6,7,8,9,5],
    [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],
    [4,0,1,2,3,9,5,6,7,8],
    [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],
    [7,6,5,9,8,2,1,0,4,3],
    [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0],
]

_P = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,5,7,6,2,8,3,0,9,4],
    [5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],
    [9,4,5,3,1,2,6,8,7,0],
    [4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],
    [7,0,4,6,9,1,3,2,5,8],
]

_INV = [0,4,3,2,1,5,6,7,8,9]


def _digits_reversed(number: str) -> list[int]:
    return [int(d) for d in reversed(number)]


def validate(number: str) -> bool:
    """True if `number` (including its own checksum digit) is valid."""
    if not number.isdigit():
        return False
    c = 0
    for i, digit in enumerate(_digits_reversed(number)):
        c = _D[c][_P[i % 8][digit]]
    return c == 0


def generate_check_digit(body: str) -> int:
    """Given the first 11 digits, return the 12th (checksum) digit."""
    if not body.isdigit() or len(body) != 11:
        raise ValueError("body must be exactly 11 digits")
    c = 0
    for i, digit in enumerate(_digits_reversed(body)):
        c = _D[c][_P[(i + 1) % 8][digit]]
    return _INV[c]


def is_valid_aadhaar_format(number: str) -> bool:
    """12 digits, doesn't start with 0 or 1, passes Verhoeff checksum."""
    return (
        len(number) == 12
        and number.isdigit()
        and number[0] not in ("0", "1")
        and validate(number)
    )