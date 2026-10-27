from typing import Literal

from pydantic import BaseModel


class LearningPathStep(BaseModel):
    lesson_id: int
    course_id: int
    course_title: str
    domain: str
    title: str
    summary: str = ""
    duration_minutes: float = 0
    cover_url: str | None = None
    kind: Literal["lesson", "explore"]
    state: Literal["completed", "current", "locked"]


class LearningPathResponse(BaseModel):
    steps: list[LearningPathStep]
    completed_count: int
    total_count: int
    next_lesson_id: int | None
