import type { ReactNode } from "react";

export interface AlertBannerProps {
  tone: "info" | "warning" | "danger";
  title: string;
  children?: ReactNode;
}

export function AlertBanner({ tone, title, children }: AlertBannerProps) {
  return (
    <div className={`smart-alert smart-alert--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <div>
        <div className="smart-alert__title">{title}</div>
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
