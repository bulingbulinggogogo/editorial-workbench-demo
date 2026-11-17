from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from .models import WordTime


@lru_cache(maxsize=2)
def _load_model(model_source: str):
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise RuntimeError("尚未安装 faster-whisper，请先执行 pip install -r requirements.txt") from exc

    return WhisperModel(model_source, device="auto", compute_type="int8")


def _resolve_model_source(model_name: str, model_dir: str | None) -> str:
    if model_dir:
        return str(Path(model_dir).expanduser())
    if os.environ.get("LISTENING_MODEL_SOURCE") != "modelscope":
        return model_name
    try:
        from modelscope_hub.compat import snapshot_download
    except ImportError as exc:
        raise RuntimeError("程序缺少国内模型下载组件，请使用最新的 Windows 便携包") from exc

    model_id = f"pengzhendong/faster-whisper-{model_name}"
    cache_root = Path(os.environ.get("MODELSCOPE_CACHE", Path.cwd() / "models_cache"))
    local_dir = cache_root / model_name
    try:
        return str(snapshot_download(repo_id=model_id, local_dir=str(local_dir)))
    except Exception as exc:
        raise RuntimeError(f"从国内模型源下载 {model_name} 失败：{exc}") from exc


def transcribe(audio_path: str, model_name: str = "base.en", model_dir: str | None = None) -> tuple[str, list[WordTime], float]:
    model_source = _resolve_model_source(model_name, model_dir)
    model = _load_model(model_source)
    segments, info = model.transcribe(
        audio_path, language="en", beam_size=5, word_timestamps=True,
        vad_filter=True, condition_on_previous_text=False,
    )
    words: list[WordTime] = []
    text_parts: list[str] = []
    last_end = 0.0
    for segment in segments:
        text_parts.append(segment.text.strip())
        last_end = max(last_end, float(segment.end))
        for word in segment.words or []:
            words.append(WordTime(word.word.strip(), float(word.start), float(word.end)))
    duration = float(getattr(info, "duration", 0.0) or last_end)
    return " ".join(part for part in text_parts if part), words, duration
