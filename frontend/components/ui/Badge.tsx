/**
 * CampusOS — Badge Component
 * Status and label badge with color variants.
 */
type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "planned";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-white/5 text-slate-300 border-white/10",
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  error: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  info: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  planned: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
