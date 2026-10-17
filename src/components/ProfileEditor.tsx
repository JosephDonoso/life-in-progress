import { useState, useEffect } from "react";
import type { LifeProgress } from "../hooks/useLifeProgress";
import { Avatar } from "./Avatar";
import { useLanguage } from "../i18n/useLanguage";
export function ProfileEditor({ model: m }: { model: LifeProgress }) {
  const { t: tr } = useLanguage();

  const { t } = useLanguage();
  const [name, setName] = useState(m.name),
    [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<string | null>(null),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);
  return (
    <form
      className="profile-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaved(false);
        if (
          await m.editProfile(
            { display_name: name, avatar_url: m.avatar },
            file,
          )
        ) {
          setFile(null);
          setPreview(null);
          setSaved(true);
        }
      }}
    >
      <h3>{tr("Editar perfil")}</h3>
      <div className="photo-editor">
        <Avatar name={name} src={preview || m.avatar} />
        <label>
          {tr("Foto de perfil")}
          <input
            aria-label={tr("Foto de perfil")}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={m.profileSaving}
            onChange={(e) => {
              const next = e.target.files?.[0] || null;
              setFile(next);
              setPreview(next ? URL.createObjectURL(next) : null);
              setSaved(false);
            }}
          />
        </label>
      </div>
      <small>{tr("Usa una imagen JPG, PNG o WebP de hasta 2 MB.")}</small>
      <label className="profile-name">
        {tr("Nombre visible")}
        <input
          aria-label={tr("Nombre visible")}
          required
          minLength={2}
          maxLength={40}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          disabled={m.profileSaving}
        />
      </label>
      <button className="secondary" type="submit" disabled={m.profileSaving}>
        {t(m.profileSaving ? "Guardando…" : "Guardar cambios")}
      </button>
      {saved && <span role="status">{tr("Cambios guardados.")}</span>}
      <p className="muted">
        {tr("Tu nombre y foto serán visibles cuando tu perfil sea público.")}
      </p>
    </form>
  );
}
