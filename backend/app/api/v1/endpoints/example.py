from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class ExampleItem(BaseModel):
    id: int
    name: str
    description: str = None


# Mock data
EXAMPLES = [
    ExampleItem(id=1, name="Example 1", description="This is the first example"),
    ExampleItem(id=2, name="Example 2", description="This is the second example"),
]


@router.get("/", response_model=List[ExampleItem])
async def read_examples():
    """
    Retrieve examples.
    """
    return EXAMPLES


@router.get("/{example_id}", response_model=ExampleItem)
async def read_example(example_id: int):
    """
    Get a specific example by ID.
    """
    for example in EXAMPLES:
        if example.id == example_id:
            return example
    raise HTTPException(status_code=404, detail="Example not found")
