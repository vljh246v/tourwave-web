import React from "react";

export interface CardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Card({ header, footer, children, className = "" }: CardProps) {
  return (
    <div
      className={[
        "rounded-lg border border-gray-200 bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {header ? (
        <div className="border-b border-gray-200 px-4 py-3">{header}</div>
      ) : null}
      <div className="px-4 py-4">{children}</div>
      {footer ? (
        <div className="border-t border-gray-200 px-4 py-3">{footer}</div>
      ) : null}
    </div>
  );
}
