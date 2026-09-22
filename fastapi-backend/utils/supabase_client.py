import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()


@lru_cache
def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_KEY"]
    return create_client(url, key)


def get_scheme(scheme_id: str) -> dict[str, Any] | None:
    result = (
        get_supabase()
        .table("schemes")
        .select("rules, required_docs")
        .eq("id", scheme_id)
        .execute()
    )
    rows = result.data or []
    return rows[0] if rows else None
