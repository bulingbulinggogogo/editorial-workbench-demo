#!/usr/bin/env python3
"""Archive all project files except the backup directory; verify every entry."""
import hashlib
import json
import os
from pathlib import Path
import tarfile
from datetime import datetime
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / '迁移备份'


def digest(stream):
    h = hashlib.sha256()
    while chunk := stream.read(1024 * 1024):
        h.update(chunk)
    return h.hexdigest()


def main():
    DEST.mkdir(exist_ok=True)
    stamp = datetime.now(ZoneInfo('Asia/Shanghai')).strftime('%Y%m%d-%H%M%S-%f')
    archive = DEST / f'教研后台-完整工程-{stamp}.tar.gz'
    temporary = archive.with_suffix('.partial')
    entries = {}
    # Do not follow symlinks: preserve their targets exactly.
    for folder, dirs, files in os.walk(ROOT, followlinks=False):
        base = Path(folder)
        dirs[:] = sorted(d for d in dirs if base / d != DEST)
        for name in sorted(dirs + files):
            path = base / name
            rel = path.relative_to(ROOT).as_posix()
            if path.is_symlink():
                entries[rel] = {'type': 'symlink', 'target': os.readlink(path)}
            elif path.is_file():
                with path.open('rb') as stream:
                    entries[rel] = {'type': 'file', 'sha256': digest(stream)}
            elif path.is_dir():
                entries[rel] = {'type': 'directory'}
            else:
                raise RuntimeError(f'不支持的文件类型，备份未完成：{rel}')
    try:
        with tarfile.open(temporary, 'w:gz', dereference=False) as bundle:
            bundle.add(ROOT, arcname=ROOT.name, recursive=False)
            for rel in entries:
                bundle.add(ROOT / rel, arcname=f'{ROOT.name}/{rel}', recursive=False)
        with tarfile.open(temporary, 'r:gz') as bundle:
            members = bundle.getmembers()
            assert len(members) == len(entries) + 1, '归档条目数量不符'
            for rel, info in entries.items():
                member = bundle.getmember(f'{ROOT.name}/{rel}')
                if info['type'] == 'file':
                    with bundle.extractfile(member) as stream:
                        assert digest(stream) == info['sha256'], f'文件校验失败：{rel}'
                elif info['type'] == 'symlink':
                    assert member.issym() and member.linkname == info['target'], rel
                else:
                    assert member.isdir(), rel
        temporary.rename(archive)
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise
    with archive.open('rb') as stream:
        archive_hash = digest(stream)
    report = {'created_at': datetime.now(ZoneInfo('Asia/Shanghai')).isoformat(),
              'archive': archive.name, 'archive_sha256': archive_hash,
              'verified': True, 'entries_count': len(entries),
              'excluded': ['迁移备份/'],
              'scope': '工程文件；不包含浏览器数据、聊天记录或工程外技能环境',
              'entries': entries}
    manifest = archive.with_suffix('.manifest.json')
    manifest.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    pointer = DEST / '最新备份.txt'
    pointer.write_text(f'最新完整工程文件快照：{archive.name}\n校验清单：{manifest.name}\n'
                       f'SHA-256：{archive_hash}\n已逐项验证 {len(entries)} 个条目。\n'
                       '不包含浏览器业务数据/音频、账号聊天和工程外技能。\n'
                       '复制压缩包及校验清单到新电脑，解压后先阅读项目交接.md。\n', encoding='utf-8')
    print(f'备份完成：{archive}\n已验证：{len(entries)} 个条目\n大小：{archive.stat().st_size / 1024 / 1024:.1f} MB')


if __name__ == '__main__':
    main()
