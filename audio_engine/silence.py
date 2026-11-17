from __future__ import annotations

from pathlib import Path

from .models import Utterance


def refine_utterance_boundaries(
    utterances: list[Utterance], audio_path: str | Path, duration: float
) -> None:
    """Move sentence boundaries into nearby quiet regions without changing text."""
    if not utterances:
        return
    try:
        quiet_intervals, decoded_duration = _quiet_intervals(audio_path)
        duration = max(duration, decoded_duration)
    except Exception:
        # Timing generation must still succeed if a codec cannot be analysed.
        quiet_intervals = []
    _apply_quiet_boundaries(utterances, quiet_intervals, duration)


def _quiet_intervals(audio_path: str | Path) -> tuple[list[tuple[float, float]], float]:
    import numpy as np
    from faster_whisper.audio import decode_audio

    sample_rate = 16_000
    audio = np.asarray(decode_audio(str(audio_path), sampling_rate=sample_rate), dtype=np.float32)
    duration = len(audio) / sample_rate
    frame_size = max(1, round(sample_rate * 0.020))
    hop_size = max(1, round(sample_rate * 0.010))
    if len(audio) < frame_size:
        return [], duration

    squared = np.square(audio, dtype=np.float64)
    cumulative = np.concatenate(([0.0], np.cumsum(squared)))
    energy = (cumulative[frame_size:] - cumulative[:-frame_size]) / frame_size
    rms = np.sqrt(np.maximum(0.0, energy[::hop_size]))
    if not len(rms):
        return [], duration

    noise = float(np.percentile(rms, 15))
    speech = float(np.percentile(rms, 90))
    if speech <= 1e-7:
        return [(0.0, duration)], duration
    threshold = min(speech * 0.22, noise + (speech - noise) * 0.18)
    threshold = max(0.0015, threshold)
    quiet = rms <= threshold

    minimum_frames = max(4, round(0.060 / (hop_size / sample_rate)))
    intervals: list[tuple[float, float]] = []
    run_start: int | None = None
    for index, is_quiet in enumerate(quiet):
        if is_quiet and run_start is None:
            run_start = index
        if run_start is not None and (not is_quiet or index == len(quiet) - 1):
            run_end = index + 1 if is_quiet else index
            if run_end - run_start >= minimum_frames:
                start = run_start * hop_size / sample_rate
                end = min(duration, (run_end * hop_size + frame_size) / sample_rate)
                intervals.append((start, end))
            run_start = None
    return intervals, duration


def _apply_quiet_boundaries(
    utterances: list[Utterance], quiet_intervals: list[tuple[float, float]], duration: float
) -> None:
    duration = max(0.0, float(duration or 0.0))
    for index in range(len(utterances) - 1):
        current, following = utterances[index], utterances[index + 1]
        left = float(current.end or current.start or 0.0)
        right = float(following.start if following.start is not None else left)
        if right >= left:
            boundary = _quiet_midpoint(quiet_intervals, left, right)
            if boundary is None:
                boundary = (left + right) / 2
        else:
            boundary = (left + right) / 2
        boundary = max(float(current.start or 0.0), min(float(following.end or duration), boundary))
        current.end = boundary
        following.start = boundary

    first = utterances[0]
    first_start = float(first.start or 0.0)
    leading = _last_quiet_midpoint(quiet_intervals, max(0.0, first_start - 0.6), first_start)
    if leading is not None:
        first.start = leading

    last = utterances[-1]
    last_end = float(last.end or last.start or 0.0)
    limit = min(duration, last_end + 0.8) if duration else last_end + 0.25
    trailing = _first_quiet_midpoint(quiet_intervals, last_end, limit)
    last.end = trailing if trailing is not None else min(duration or last_end + 0.2, last_end + 0.2)

    for utterance in utterances:
        utterance.start = max(0.0, float(utterance.start or 0.0))
        utterance.end = max(utterance.start, float(utterance.end or utterance.start))
        if utterance.words:
            utterance.words[0].start = utterance.start
            utterance.words[-1].end = utterance.end


def _quiet_midpoint(
    intervals: list[tuple[float, float]], left: float, right: float
) -> float | None:
    candidates = []
    center = (left + right) / 2
    for start, end in intervals:
        overlap_start, overlap_end = max(start, left), min(end, right)
        if overlap_end > overlap_start:
            midpoint = (overlap_start + overlap_end) / 2
            candidates.append((overlap_end - overlap_start, -abs(midpoint - center), midpoint))
    return max(candidates)[2] if candidates else None


def _first_quiet_midpoint(
    intervals: list[tuple[float, float]], left: float, right: float
) -> float | None:
    for start, end in intervals:
        overlap_start, overlap_end = max(start, left), min(end, right)
        if overlap_end > overlap_start:
            return (overlap_start + overlap_end) / 2
    return None


def _last_quiet_midpoint(
    intervals: list[tuple[float, float]], left: float, right: float
) -> float | None:
    for start, end in reversed(intervals):
        overlap_start, overlap_end = max(start, left), min(end, right)
        if overlap_end > overlap_start:
            return (overlap_start + overlap_end) / 2
    return None
