import { ArrowRight, Plus, Sparkles, Users, Zap, ScanLine } from "lucide-react";
import { Flower, TopicArt, ArrowCircle } from "./UI";
import { useState, type FormEvent } from "react";
const topics = [
  {
    title: "На орбите",
    topic: "Космос и планеты",
    label: "КОСМОС",
    kind: "space" as const,
  },
  {
    title: "Кино и сериалы",
    topic: "Кино и поп-культура",
    label: "ПОП-КУЛЬТУРА",
    kind: "culture" as const,
  },
  {
    title: "Чистая наука",
    topic: "Удивительная наука",
    label: "НАУКА",
    kind: "science" as const,
  },
  {
    title: "Всего понемногу",
    topic: "Общие знания",
    label: "МИКС",
    kind: "random" as const,
  },
];
export function Home({
  onCreate,
  onJoin,
}: {
  onCreate: (topic?: string) => void;
  onJoin: (code?: string) => void;
}) {
  const [code, setCode] = useState("");
  function join(event: FormEvent) {
    event.preventDefault();
    onJoin(code);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">МЕНЬШЕ СКРОЛЛА. БОЛЬШЕ АЗАРТА.</p>
          <h1>Ну что, сыграем<span className="purple">?</span></h1>
        </div>
        <span className="small-note">
          <span className="status-dot" />
          Для любопытных и их друзей
        </span>
      </div>
      <section className="home-grid" aria-label="Начать игру">
        <div className="hero-panel">
          <span className="pill hero-label">
            <Sparkles size={15} />
            Твоя тема. Вопросы от ИИ.
          </span>
          <h2>
            Есть вопрос.
            <br />
            Будет{" "}
            <span className="hero-word">
              баттл
              <svg viewBox="0 0 250 16" aria-hidden="true">
                <path
                  d="M4 11Q120-2 246 9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
          <p>
            Собери друзей. Выбери любую тему.
            <br />И узнай, кто здесь знает больше всех.
          </p>
          <button
            className="button primary hero-cta"
            onClick={() => onCreate()}
          >
            <Plus size={22} />
            Создать игру
            <ArrowRight size={22} />
          </button>
          <div className="hero-caption">
            <span className="avatar-stack">
              <span>🦊</span>
              <span>👾</span>
              <span>🐸</span>
            </span>
            <span>Вместе интереснее</span>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="art-spark spark-one">✦</span>
            <span className="art-spark spark-two">✧</span>
            <div className="art-back-card" />
            <div className="art-card">
              <span className="art-card-top">
                ВОПРОС НА МИЛЛИОН <Zap size={15} />
              </span>
              <div className="art-question">
                Кто тут
                <br />
                самый умный?
              </div>
              <div className="art-option">
                А. Конечно, я <span>✦</span>
              </div>
              <div className="art-option second">Б. Сейчас узнаем</div>
            </div>
            <Flower className="art-flower">
              <Zap size={48} fill="currentColor" strokeWidth={1.5} />
            </Flower>
            <span className="art-tag">
              <span>✧</span> +1000 к настроению
            </span>
          </div>
        </div>
        <aside className="join-panel">
          <div className="join-top">
            <span className="icon-tile">
              <ScanLine size={27} />
            </span>
            <span className="eyebrow">УЖЕ ЕСТЬ КОД?</span>
          </div>
          <h2>
            Залетай
            <br /> в комнату<span>↗</span>
          </h2>
          <p>
            Друзья создали игру?
            <br />
            Тебе нужны только 6 цифр.
          </p>
          <form onSubmit={join}>
            <label className="sr-only" htmlFor="home-code">
              Код комнаты
            </label>
            <input
              id="home-code"
              className="home-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000 000"
              required
            />
            <button className="button dark full">
              Войти по коду
              <ArrowRight size={19} />
            </button>
          </form>
          <span className="join-foot">
            <Users size={15} />
            Без регистрации. Без ожиданий.
          </span>
        </aside>
      </section>
      <section className="topics-section">
        <div className="section-heading">
          <div>
            <h2>С чего начнём?</h2>
            <p>Пара идей для первого раунда. Или придумай свою.</p>
          </div>
          <span className="section-tag">
            <Sparkles size={14} />
            Вдохновение здесь
          </span>
        </div>
        <div className="topic-grid">
          {topics.map((item) => (
            <button
              className={`topic-card ${item.kind}`}
              key={item.kind}
              onClick={() => onCreate(item.topic)}
            >
              <span className="topic-label">{item.label}</span>
              <TopicArt kind={item.kind} />
              <span className="topic-bottom">
                <strong>{item.title}</strong>
                <ArrowCircle />
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="how-strip" aria-label="Как играть">
        <div className="how-title">
          <Flower>
            <Zap size={25} fill="currentColor" />
          </Flower>
          <h3>От идеи до «ещё одну!»</h3>
        </div>
        {[
          ["01", "Задай тему", "ИИ соберёт вопросы за тебя"],
          ["02", "Позови своих", "Отправь код или QR друзьям"],
          ["03", "Лови момент", "Отвечай быстрее. Забирай очки."],
        ].map(([n, title, text]) => (
          <div className="how-step" key={n}>
            <span>{n}</span>
            <div>
              <h4>{title}</h4>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
