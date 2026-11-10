#!/bin/zsh
set -e
cd "$(dirname "$0")/frontend"
if ! command -v npm >/dev/null 2>&1; then
  print 'Для запуска нужен Node.js 22+ (nodejs.org). После установки открой этот файл снова.'
  read '?Нажми Enter, чтобы закрыть окно.'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci
fi
print 'Открой Local URL из вывода ниже. Чтобы остановить — нажми Ctrl+C.'
npm run dev -- --host 0.0.0.0
