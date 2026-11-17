"""Local, stateless adapter for the existing 跟读处理 alignment engine."""
import json
import secrets
import tempfile
import threading
from email import policy
from email.parser import BytesParser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

TOKEN = secrets.token_urlsafe(32)
LOCK = threading.Lock()
MAX_BYTES = 52 * 1024 * 1024
ORIGINS = {'null', 'http://127.0.0.1:8766', 'http://localhost:8766'}


def align(audio_path, segments):
    from audio_engine.models import Utterance
    from audio_engine.transcriber import transcribe
    from audio_engine.alignment import align_utterances
    from audio_engine.silence import refine_utterance_boundaries
    _, words, duration = transcribe(str(audio_path))
    if not words:
        raise ValueError('未识别到有效英文语音，请检查音频')
    rows = [Utterance(str(s.get('speaker', '')), str(s['text'])) for s in segments]
    align_utterances(rows, words, duration)
    refine_utterance_boundaries(rows, audio_path, duration)
    return {'segments': [{'start': r.start, 'end': r.end} for r in rows]}


class Handler(BaseHTTPRequestHandler):
    def allowed(self):
        return self.headers.get('Origin', 'null') in ORIGINS and self.headers.get('Host') in {'127.0.0.1:8766', 'localhost:8766'}

    def reply(self, code, value):
        body = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(code)
        if self.allowed():
            self.send_header('Access-Control-Allow-Origin', self.headers.get('Origin', 'null'))
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Audio-Token')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Private-Network', 'true')
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.reply(200 if self.allowed() else 403, {})

    def do_GET(self):
        if not self.allowed():
            return self.reply(403, {'error': '来源不允许'})
        self.reply(200, {'token': TOKEN}) if self.path == '/health' else self.reply(404, {})

    def do_POST(self):
        if not self.allowed() or self.headers.get('X-Audio-Token') != TOKEN:
            return self.reply(403, {'error': '请求验证失败'})
        if self.path != '/align':
            return self.reply(404, {})
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= MAX_BYTES:
                return self.reply(413, {'error': '音频文件过大或为空'})
        except ValueError:
            return self.reply(400, {'error': '无效请求'})
        if not LOCK.acquire(blocking=False):
            return self.reply(409, {'error': '正在处理另一段音频，请稍后重试'})
        try:
            message = BytesParser(policy=policy.default).parsebytes(
                ('Content-Type: ' + self.headers.get('Content-Type', '') + '\r\nMIME-Version: 1.0\r\n\r\n').encode() + self.rfile.read(size))
            fields = {p.get_param('name', header='content-disposition'): p for p in message.iter_parts()}
            segments = json.loads(fields['segments'].get_payload(decode=True))
            if not isinstance(segments, list) or not 0 < len(segments) <= 500 or any(not isinstance(s, dict) or not str(s.get('text', '')).strip() for s in segments):
                raise ValueError('句子内容无效')
            audio = fields['audio'].get_payload(decode=True)
            if not audio or len(audio) > 50 * 1024 * 1024:
                raise ValueError('音频文件无效')
            suffix = Path(fields['audio'].get_filename() or 'audio.wav').suffix.lower()
            if suffix not in {'.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'}:
                raise ValueError('不支持的音频格式')
            with tempfile.TemporaryDirectory(prefix='teaching-audio-') as directory:
                path = Path(directory) / ('audio' + suffix)
                path.write_bytes(audio)
                result = align(path, segments)
            self.reply(200, result)
        except Exception as error:
            self.reply(400, {'error': '自动对齐失败：' + str(error)})
        finally:
            LOCK.release()


if __name__ == '__main__':
    print('本机音频对齐服务：http://127.0.0.1:8766', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8766), Handler).serve_forever()
