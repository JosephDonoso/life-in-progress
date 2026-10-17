import { Gamepad2 } from "lucide-react";
export function Avatar({
  name,
  src,
  small = false,
}: {
  name: string;
  src?: string | null;
  small?: boolean;
}) {
  return (
    <span className={`avatar ${small ? "small" : ""}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : name ? (
        <span>{name[0].toUpperCase()}</span>
      ) : (
        <Gamepad2 size={28} />
      )}
    </span>
  );
}
