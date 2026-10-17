import { useLanguage } from "../i18n/useLanguage";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { scenes, photo } from "../data";
import { Brand } from "../components/Brand";
import { db } from "../service";
import { projectLinks } from "../config";
export function ProductShowcase({ players }: { players: number }) {
  const { t: tr, language } = useLanguage();

  const [scene, setScene] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const selected = strip.current?.children[scene] as HTMLElement | undefined;
    if (selected && strip.current)
      strip.current.scrollTo({
        left: selected.offsetLeft - strip.current.offsetLeft,
        behavior: "smooth",
      });
  }, [scene]);
  const change = (step: number) =>
    setScene((i) => (i + step + scenes.length) % scenes.length);
  return (
    <section
      className="showcase"
      aria-label={tr("Presentación de Life in Progress")}
    >
      <div className="gallery">
        <div
          className="hero"
          style={{
            backgroundImage: `linear-gradient(90deg,rgba(3,12,22,.99) 0%,rgba(3,12,22,.94) 20%,rgba(3,12,22,.5) 45%,rgba(3,12,22,0) 76%),url(${scene === 0 ? `${import.meta.env.BASE_URL}images/life-adventure.png` : photo(scenes[scene][1])})`,
          }}
        >
          <div className="hero-copy">
            <Brand hero />
            <p>{tr("The game you're already playing.")}</p>
          </div>
        </div>
        <div className="carousel-strip">
          <button
            className="carousel-arrow"
            aria-label={tr("Imagen anterior")}
            onClick={() => change(-1)}
          >
            <ChevronLeft size={21} />
          </button>
          <div className="thumbnails" ref={strip}>
            {scenes.map(([title, id], i) => (
              <button
                key={title}
                onClick={() => setScene(i)}
                className={scene === i ? "selected" : ""}
                aria-label={tr(title)}
                aria-pressed={scene === i}
              >
                <img
                  src={
                    i === 0
                      ? `${import.meta.env.BASE_URL}images/life-adventure.png`
                      : photo(id, 400)
                  }
                  alt={tr(title)}
                />
              </button>
            ))}
          </div>
          <button
            className="carousel-arrow"
            aria-label={tr("Imagen siguiente")}
            onClick={() => change(1)}
          >
            <ChevronRight size={21} />
          </button>
        </div>
      </div>
      <aside className="game-info">
        <h3>{tr("Una colección de logros para tu vida real.")}</h3>
        <p>
          {tr(
            "Descubre, recuerda y registra las experiencias que te hacen ser quien eres. Desde los momentos más comunes hasta los más extraordinarios, cada logro cuenta una parte de tu historia. ",
          )}
        </p>
        <dl>
          <div>
            <dt>{tr("JUGADORES")}</dt>
            <dd>
              {players.toLocaleString(language === "en" ? "en-US" : "es-CL")}{" "}
              {tr(db ? "registrados" : "en la demostración")}
            </dd>
          </div>
          <div>
            <dt>{tr("DESARROLLADOR")}</dt>
            <dd>
              <a
                href={projectLinks.developer}
                target="_blank"
                rel="noopener noreferrer"
              >
                JosephDonoso
              </a>
            </dd>
          </div>
          <div>
            <dt>{tr("EDITOR")}</dt>
            <dd>
              <a
                href={projectLinks.portfolio}
                target="_blank"
                rel="noopener noreferrer"
              >
                JDevShowcase
              </a>
            </dd>
          </div>
        </dl>
        <small>{tr("Etiquetas populares para este proyecto:")}</small>
        <div className="tags">
          {["Vida real", "Logros", "Estadísticas", "Exploración"].map((t) => (
            <span key={t}>{tr(t)}</span>
          ))}
        </div>
      </aside>
    </section>
  );
}
