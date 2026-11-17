from __future__ import annotations

import re
from difflib import SequenceMatcher

from .models import Utterance, WordTime


TOKEN_RE = re.compile(r"[A-Za-z]+(?:['’][A-Za-z]+)?|\d+(?:\.\d+)?")


def tokens(text: str) -> list[str]:
    return [token.replace("’", "'").casefold() for token in TOKEN_RE.findall(text)]


def align_utterances(utterances: list[Utterance], asr_words: list[WordTime], duration: float | None = None) -> None:
    manuscript: list[str] = []
    owners: list[tuple[int, int]] = []
    for index, utterance in enumerate(utterances):
        display_words = re.findall(r"\S+", utterance.text)
        utterance.words = [WordTime(word, 0.0, 0.0) for word in display_words]
        for word_index, word in enumerate(display_words):
            normalized = "".join(tokens(word))
            if normalized:
                manuscript.append(normalized)
                owners.append((index, word_index))

    heard = [tokens(word.word)[0] if tokens(word.word) else "" for word in asr_words]
    heard_pairs = [(i, token) for i, token in enumerate(heard) if token]
    heard_clean = [token for _, token in heard_pairs]
    matcher = SequenceMatcher(None, manuscript, heard_clean, autojunk=False)
    mapped: dict[int, int] = {}
    for block in matcher.get_matching_blocks():
        for offset in range(block.size):
            mapped[block.a + offset] = heard_pairs[block.b + offset][0]

    for utterance_index, utterance in enumerate(utterances):
        manuscript_indices = [i for i, owner in enumerate(owners) if owner[0] == utterance_index]
        word_indices = [mapped[i] for i in manuscript_indices if i in mapped]
        if word_indices:
            utterance.start = max(0.0, asr_words[min(word_indices)].start)
            utterance.end = max(utterance.start, asr_words[max(word_indices)].end)

    _fill_missing_times(utterances, duration or (asr_words[-1].end if asr_words else 0.0))
    for manuscript_index, asr_index in mapped.items():
        utterance_index, word_index = owners[manuscript_index]
        utterances[utterance_index].words[word_index].start = asr_words[asr_index].start
        utterances[utterance_index].words[word_index].end = asr_words[asr_index].end
    for utterance in utterances:
        _fill_word_times(utterance)


def _fill_word_times(utterance: Utterance) -> None:
    if not utterance.words:
        return
    start = float(utterance.start or 0.0)
    end = float(utterance.end or start)
    count = len(utterance.words)
    for index, word in enumerate(utterance.words):
        if word.end <= word.start:
            word.start = start + (end - start) * index / count
            word.end = start + (end - start) * (index + 1) / count


def _fill_missing_times(utterances: list[Utterance], duration: float) -> None:
    if not utterances:
        return
    weights = [max(1, len(tokens(row.text))) for row in utterances]
    total = sum(weights)
    cursor = 0.0
    estimates: list[tuple[float, float]] = []
    for weight in weights:
        start = duration * cursor / total if total else 0.0
        cursor += weight
        estimates.append((start, duration * cursor / total if total else 0.0))
    for index, row in enumerate(utterances):
        if row.start is None:
            row.start = estimates[index][0]
        if row.end is None:
            row.end = estimates[index][1]
        if index and row.start < utterances[index - 1].start:
            row.start = utterances[index - 1].end
        row.end = max(row.start, row.end)


def estimate_utterances(utterances: list[Utterance], duration: float) -> None:
    _fill_missing_times(utterances, duration)
