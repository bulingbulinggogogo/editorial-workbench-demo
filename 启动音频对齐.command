#!/bin/zsh
set -e
cd "${0:A:h}"
if [[ -x '/Users/baokeyu/codex项目/跟读处理/.venv/bin/python' ]]; then
  exec '/Users/baokeyu/codex项目/跟读处理/.venv/bin/python' audio_service.py
fi
if [[ ! -x .audio-venv/bin/python ]]; then
  python3 -m venv .audio-venv
  .audio-venv/bin/python -m pip install 'faster-whisper>=1.1,<2'
fi
exec .audio-venv/bin/python audio_service.py
