from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class WordTime:
    word: str
    start: float
    end: float


@dataclass
class Utterance:
    speaker: str
    text: str
    start: float | None = None
    end: float | None = None
    words: list[WordTime] = field(default_factory=list)


@dataclass
class ReviewItem:
    key: str
    old_script_id: str
    audio_filename: str
    audio_path: str | None
    source_html: str
    display_html: str
    utterances: list[Utterance] = field(default_factory=list)
    status: str = "待处理"
    error: str = ""
    asr_text: str = ""
    old_set_id: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> "ReviewItem":
        value = dict(value)
        value.setdefault("old_set_id", value.get("old_script_id", ""))
        utterances = []
        for row in value.get("utterances", []):
            row = dict(row)
            row["words"] = [WordTime(**word) for word in row.get("words", [])]
            utterances.append(Utterance(**row))
        value["utterances"] = utterances
        return cls(**value)
