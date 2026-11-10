# ⚡ QuizBlitz — Backend Game Engine & WebSocket (Часть @eco1kd)

Модуль игрового движка реального времени и WebSocket-сервера для QuizBlitz.
Реализован строго по контракту из разделов 6, 7, 8 и 9 документа `quizblitz-project.md`.

---

## 📌 Что реализовано в зоне ответственности @eco1kd

1. **WebSocket / Socket.IO Сервер**:
   - Полноценная обработка подключений хоста и игроков
   - Изолированные комнаты по уникальному 6-значному коду (`100000`–`999999`)
   - Поддержка CORS и вебсокет-транспортов для фронтенда

2. **Жизненный цикл игры (Game Lifecycle)**:
   - `LOBBY` → `QUESTION` → `REVEAL` → `LEADERBOARD` → `FINISHED`
   - Переход по раундам и вопросам под управлением хоста (`game:start`, `game:next`)
   - Автоматический переход к показу ответа при истечении таймера или когда ответили все игроки

3. **Серверный таймер**:
   - Таймер обратного отсчёта работает на стороне сервера (клиенты не определяют время)
   - Сервер шлёт событие `timer:tick` каждую секунду

4. **Приём ответов и формула подсчёта очков (Раздел 7)**:
   - `очки = 1000 * (оставшееся_время / общее_время)` при верном ответе
   - `очки = 0` при неверном ответе
   - Бонусы за серии правильных ответов:
     - 0–2 подряд: `x1.0`
     - 3–4 подряд: `x1.2`
     - 5+ подряд: `x1.5`
   - Защита от повторной отправки ответа на один и тот же вопрос

5. **Реконнект игроков**:
   - Игровой стейт, очки и серии хранятся в памяти сервера
   - При временном дисконнекте игрок помечается как отключённый, но не удаляется
   - При повторном `room:join` с `playerId` или никнеймом игрок восстанавливается с сохранением очков и текущей фазы

6. **Турнирная таблица и статистика игры**:
   - Автоматический расчёт рангов и `previousRank` (для анимаций на фронтенде)
   - Финальная статистика: общее число вопросов, правильные ответы, среднее время ответа, максимальная серия, самый сложный вопрос

7. **Резервные вопросы и точка интеграции с ИИ**:
   - Встроенный резервный банк вопросов (`fallback.json` + `fallbackQuestions.ts`) с перемешиванием вариантов ответов
   - Интерфейс `QuestionProvider` для бесшовного подключения ИИ от @raikuchan

---

## 🔌 Контракт событий (WebSocket)

### Клиент → Сервер
| Событие | Данные | Описание |
|---|---|---|
| `room:create` | `{ topic, questionCount, difficulty }` | Хост создаёт комнату |
| `room:join` | `{ code, nickname, avatar?, playerId? }` | Игрок заходит в комнату или восстанавливает сессию |
| `game:start` | `{}` | Хост запускает игру |
| `answer:submit` | `{ questionId, optionIndex }` | Игрок отправляет ответ (0..3) |
| `game:next` | `{}` | Хост переключает этап (показ ответа → таблица → след. вопрос / финал) |

### Сервер → Клиент
| Событие | Данные | Кому | Описание |
|---|---|---|---|
| `room:created` | `{ code, roomId }` | Хосту | Код и ID созданной комнаты |
| `room:updated` | `{ players: [...] }` | Всем в комнате | Список участников с их статусом |
| `question:show` | `{ questionId, text, options[], timeLimit, index, total }` | Всем | Вопрос и варианты ответов |
| `timer:tick` | `{ remaining }` | Всем | Оставшиеся секунды |
| `answer:accepted`| `{ questionId }` | Ответившему | Подтверждение приёма ответа |
| `room:player_answered` | `{ playerId }` | Всем | Индикатор ответа игрока |
| `question:reveal`| `{ correctIndex, results: [...], explanation? }` | Всем | Правильный ответ и начисленные баллы |
| `leaderboard:update` | `{ players: [...] }` | Всем | Таблица лидеров с рангами |
| `game:finished` | `{ leaderboard: [...], stats: {...} }` | Всем | Финал с подиумом и статистикой |
| `error` | `{ code, message }` | Отправителю | Сообщение об ошибке |

---

## 🤝 Точки подключения для @raikuchan (Часть 2: БД, Авторизация и ИИ)

Код движка полностью модульный. Чтобы подключить генерацию вопросов через ИИ или сохранение в БД, **не нужно менять код движка**:

### 1. Подключение ИИ-генератора вопросов:
```typescript
import { setQuestionProvider, type QuestionProvider } from './engine/questions/provider.js'

class RaikuAiQuestionProvider implements QuestionProvider {
  async getQuestions({ topic, count, difficulty }) {
    // Вызов LLM API и валидация JSON
    return generatedQuestions
  }
}

setQuestionProvider(new RaikuAiQuestionProvider())
```

### 2. Подключение сохранения результатов в БД:
```typescript
import { roomManager } from './engine/roomManager.js'

roomManager.setOnGameFinishedHook(async (room, finishedData) => {
  // Сохранение итогов игры и статистики в PostgreSQL / SQLite
})
```

### 3. Подключение REST-эндпоинтов авторизации и истории:
В `server.ts` создаётся стандартный Express `app`:
```typescript
import { createServer } from './server.js'
const { app } = createServer()

app.use('/api/auth', authRouter)
app.use('/api/games', gamesRouter)
```

---

## 🚀 Запуск и тестирование

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки с автоперезагрузкой
npm run dev

# Запуск тестов
npm test

# Сборка TypeScript
npm run build
```
