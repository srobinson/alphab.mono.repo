from typing import List

from alphab_logging import create_logger
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
logger = create_logger("particle0.api.v1.endpoints.example")


class ExampleItem(BaseModel):
    id: int
    name: str
    description: str = ""


# Mock data
EXAMPLES = [
    ExampleItem(id=1, name="Example 1", description="This is the first example"),
    ExampleItem(id=2, name="Example 2", description="This is the second example"),
]


@router.get("/", response_model=List[ExampleItem])
async def read_examples() -> List[ExampleItem]:
    """
    Retrieve examples.
    """
    logger.info("Retrieving examples")
    return EXAMPLES


@router.get("/{example_id}", response_model=ExampleItem)
async def read_example(example_id: int) -> ExampleItem:
    """
    Get a specific example by ID.
    """
    for example in EXAMPLES:
        if example.id == example_id:
            logger.info("Example found", example=example)
            return example
    logger.error("Example not found", example_id=example_id)
    raise HTTPException(status_code=404, detail="Example not found")
