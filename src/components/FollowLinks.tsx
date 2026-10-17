import { useLanguage } from "../i18n/useLanguage";
import { Code2, ExternalLink } from "lucide-react";
import { projectLinks } from "../config";
export function FollowLinks() {
  const { t: tr } = useLanguage();
  return (
    <div className="follow-links">
      <h2>{tr("Sigue el proyecto")}</h2>
      <p>{tr("Código, novedades y formas de apoyar Life in Progress.")}</p>
      <a
        className="secondary"
        href={projectLinks.github}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Code2 size={22} />
        <span>{tr("GitHub")}</span>
        <ExternalLink size={16} />
      </a>
      <a
        className="secondary kofi-link"
        href={projectLinks.kofi}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tr("Apoyar en Ko-fi")}
      >
        <img
          height={36}
          src="https://storage.ko-fi.com/cdn/kofi5.png?v=6"
          alt={tr("Apoyar en Ko-fi")}
        />
        <ExternalLink size={16} />
      </a>
    </div>
  );
}
