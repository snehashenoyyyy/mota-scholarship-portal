"""
One-off helper: generates 3 Verhoeff-valid demo Aadhaar numbers and bcrypt
password hashes for demo officials, and prints ready-to-paste SQL.

Run from the project root:
    python scripts/generate_demo_data.py
"""

import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.verhoeff import generate_check_digit

try:
    import bcrypt
except ImportError:
    bcrypt = None


def make_aadhaar() -> str:
    first = str(random.randint(2, 9))
    rest = "".join(str(random.randint(0, 9)) for _ in range(10))
    body = first + rest
    return body + str(generate_check_digit(body))


demo_people = [
    ("Asha Kumari", "2005-03-12", "Female"),
    ("Rahul Verma", "2004-07-21", "Male"),
    ("Priya Nair", "2006-01-05", "Female"),
]

print("-- Paste into Supabase SQL editor --\n")
for name, dob, gender in demo_people:
    aadhaar = make_aadhaar()
    print(
        f"insert into mock_aadhaar_kyc (aadhaar, name, dob, gender) "
        f"values ('{aadhaar}', '{name}', '{dob}', '{gender}');"
    )

print()

if bcrypt:
    demo_password = "Demo@1234"
    h1 = bcrypt.hashpw(demo_password.encode(), bcrypt.gensalt()).decode()
    h2 = bcrypt.hashpw(demo_password.encode(), bcrypt.gensalt()).decode()
    print(f"-- demo official password is: {demo_password}")
    print(
        "insert into officials (user_id, password_hash, role, name) values "
        f"('ino_demo', '{h1}', 'ino', 'Demo INO Officer'),\n"
        f"('admin_demo', '{h2}', 'ministry_admin', 'Demo Ministry Admin');"
    )
else:
    print("-- bcrypt not installed. Run: pip install bcrypt")
