import { useLanguage } from "./i18n/useLanguage";
import { ChevronRight, X } from "lucide-react";
import { useLifeProgress } from "./hooks/useLifeProgress";
import { db } from "./service";
import { SiteHeader } from "./sections/SiteHeader";
import { ProductShowcase } from "./sections/ProductShowcase";
import { PlayerActions } from "./sections/PlayerActions";
import { AchievementCatalog } from "./sections/AchievementCatalog";
import { PlayerSidebar } from "./sections/PlayerSidebar";
import { AccountDialogs } from "./sections/AccountDialogs";
import "./styles/ui.css";
import "./styles/rarities.css";
import "./styles/header.css";
import "./styles/product.css";
import "./styles/catalog.css";
import "./styles/sidebar.css";
import "./styles/dialogs.css";
import "./styles/community.css";
import "./styles/profile.css";
import "./styles/showcase.css";
import "./styles/adventure.css";
import "./styles/auth.css";
export default function App() {
  const { t: tr } = useLanguage();

  const model = useLifeProgress();
  return (
    <>
      <SiteHeader model={model} />
      <main>
        <div className="breadcrumb">
          {tr("Todos los logros ")}
          <ChevronRight size={12} /> {tr("Vida real")}{" "}
          <ChevronRight size={12} /> {tr("Life in Progress ")}
        </div>
        <div className="title-row">
          <h1>{tr("Life in Progress")}</h1>
        </div>
        <ProductShowcase players={model.stats.players} />
        <PlayerActions model={model} />
        <div className="content-layout">
          <AchievementCatalog model={model} />
          <PlayerSidebar model={model} />
        </div>
        <footer>
          {!db && (
            <span>
              {tr(
                "MODO DEMOSTRACIÓN · Datos de ejemplo · Progreso guardado en este dispositivo. ",
              )}
            </span>
          )}
          <button onClick={() => model.setModal("about")}>
            {tr("Acerca del proyecto ")}
          </button>
        </footer>
      </main>
      {model.error && (
        <div className="error" role="alert">
          {tr(model.error)}
          <button
            onClick={() => {
              model.setError("");
              model.setRetry((r) => r + 1);
            }}
          >
            {tr("Reintentar ")}
          </button>
          <button
            aria-label={tr("Cerrar error")}
            onClick={() => model.setError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <AccountDialogs model={model} />
    </>
  );
}
