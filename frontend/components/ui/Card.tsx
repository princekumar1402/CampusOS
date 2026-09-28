import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className = "", hoverable = false }: CardProps) {
  return (
    <div
      className={[
        "bg-[var(--card)] border border-[var(--border)] rounded-[9px]",
        hoverable ? "transition-all hover:border-blue-500/40 hover:shadow-md cursor-pointer" : "",
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
    <div className={["px-5 pt-5 pb-3 border-b border-[var(--border)]", className].join(" ")}>
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
  return <div className={["p-5", className].join(" ")}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["px-5 pb-5 pt-3 border-t border-[var(--border)]", className].join(" ")}>
      {children}
    </div>
  );
}
