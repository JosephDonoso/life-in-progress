import type { LifeProgress } from "../hooks/useLifeProgress";
import { Brand } from "../components/Brand";
import { SignInButton } from "../components/SignInButton";
import { SearchField } from "../components/SearchField";
import { Avatar } from "../components/Avatar";
import { useLanguage } from "../i18n/useLanguage";
export function SiteHeader({ model: m }: { model: LifeProgress }) {
  const { t: tr } = useLanguage();

  const { preference, setPreference } = useLanguage();
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="#" aria-label={tr("Life in Progress, inicio")}>
          <Brand />
        </a>
        <nav aria-label={tr("Navegación principal")}>
          <a
            className={m.tab === "Logros" ? "active" : ""}
            href="#catalog"
            onClick={() => m.setTab("Logros")}
          >
            {tr("Descubrir ")}
          </a>
          <a
            className={m.tab === "Estadísticas" ? "active" : ""}
            href="#catalog"
            onClick={() => m.setTab("Estadísticas")}
          >
            {tr("Estadísticas ")}
          </a>
          <button onClick={() => m.setModal("about")}>{tr("Acerca de")}</button>
        </nav>
        <SearchField
          className="header-search"
          label={tr("Buscar logros")}
          value={m.query}
          onChange={m.setQuery}
        />
        {m.authenticated ? (
          <button
            className="secondary account"
            onClick={() => m.setModal("profile")}
          >
            <Avatar name={m.name} src={m.avatar} small />
            {m.name.split(" ")[0]}
          </button>
        ) : (
          <SignInButton onClick={() => m.setModal("login")} />
        )}
        <select
          className="language-selector"
          aria-label={tr("Idioma / Language")}
          value={preference}
          onChange={(e) =>
            setPreference(e.target.value as "system" | "es" | "en")
          }
        >
          <option value="system">{tr("Auto")}</option>
          <option value="es">{tr("ES")}</option>
          <option value="en">{tr("EN")}</option>
        </select>
      </div>
    </header>
  );
}
