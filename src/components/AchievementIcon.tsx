export function AchievementIcon({ icon }: { icon: string }) {
  return (
    <div className="achievement-icon">
      <span>
        <span className="achievement-artwork" aria-hidden="true">
          {icon}
        </span>
      </span>
    </div>
  );
}
