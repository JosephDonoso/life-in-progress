import { useState } from "react";
import { Award } from "lucide-react";
import artwork from "../achievementArtwork.json";

const bundledArtwork: Record<string, string> = artwork;
function imageSource(icon: string) {
  if (bundledArtwork[icon])
    return `${import.meta.env.BASE_URL}images/achievements/${bundledArtwork[icon]}`;
  if (/^https?:\/\//i.test(icon)) return icon;
  if (/^(?:\.?\/|images\/)/.test(icon))
    return `${import.meta.env.BASE_URL}${icon.replace(/^(?:\.\/|\/)/, "")}`;
  return null;
}

export function AchievementIcon({ icon }: { icon: string }) {
  const source = imageSource(icon);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <div className="achievement-icon">
      <span>
        <span
          className={`achievement-artwork${!bundledArtwork[icon] && source ? " achievement-custom-image" : ""}`}
          aria-hidden="true"
        >
          {source && failedSource !== source ? (
            <img
              src={source}
              alt=""
              draggable={false}
              decoding="async"
              onError={() => setFailedSource(source)}
            />
          ) : (
            <Award strokeWidth={1.5} />
          )}
        </span>
      </span>
    </div>
  );
}
