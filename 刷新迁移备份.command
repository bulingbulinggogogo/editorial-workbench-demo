#!/bin/zsh
set -e
cd "${0:A:h}"
python3 scripts/backup-project.py
echo '备份已完成。文件位于本工程的「迁移备份」文件夹。'
read -r '?按回车关闭窗口。'
