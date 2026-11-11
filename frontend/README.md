# QuizBlitz — frontend

React + TypeScript + Vite. Экраны входа и лобби @Nonwire подключены к игровым экранам @karapuz1226 через общий `useGameEngine`.

- [Запуск всего проекта и текущий статус](../README.md)
- [Контракт REST/Socket.IO и устройство части Nonwire](INTEGRATION.md)

Из корня репозитория сначала установить зависимости обоих пакетов:

```sh
npm --prefix backend ci
npm --prefix frontend ci
```

Из `frontend`:

```sh
npm run dev       # локальное демо, если .env.local не меняет режим
npm run lint
npm run build
npm run test:e2e  # сам запускает игровой сервер и тестовые фронтенды
```

На macOS E2E использует Google Chrome; на Linux/Windows выполнить `npx playwright install chromium`. Тестам нужны свободные порты 3101 и 5180–5182.

Настройки находятся в `.env.example`. Для настоящих общих комнат использовать `VITE_GAME_MODE=live`; REST-авторизация остаётся отдельной незавершённой частью бэкенда.
