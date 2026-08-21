"""Request and response shapes for the grounded agent endpoint."""

from typing import List, Literal

from pydantic import BaseModel, Field


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AgentRequest(BaseModel):
    messages: List[Message] = Field(min_length=1, max_length=40)
    # Locale code from the frontend. Anything unknown falls back to English.
    language: str = Field(default="en", max_length=8)
