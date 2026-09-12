/**
 * CampusOS — Card Component
 * Glass-morphism card container.
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className = "", hoverable = false }: CardProps) {
  return (
    <div
      className={[
        "glass-card rounded-2xl",
        hoverable ? "feature-card cursor-pointer" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["px-6 pt-6 pb-4 border-b border-white/5", className].join(" ")}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={["px-6 py-5", className].join(" ")}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["px-6 pb-6 pt-4 border-t border-white/5", className].join(" ")}>
      {children}
    </div>
  );
}
