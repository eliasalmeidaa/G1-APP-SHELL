import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IndustrialButtonVariant = "primary" | "start" | "reset" | "emergency" | "ghost";

export interface IndustrialButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: IndustrialButtonVariant;
  /** Bloqueio de segurança (ex.: conexão STALE). Mostra o motivo no tooltip. */
  locked?: boolean;
  lockedReason?: string;
  children: ReactNode;
}

export function IndustrialButton({
  variant = "primary",
  locked = false,
  lockedReason,
  disabled,
  className = "",
  title,
  children,
  ...rest
}: IndustrialButtonProps) {
  const isDisabled = disabled || locked;
  return (
    <button
      type="button"
      className={`smart-btn smart-btn--${variant} ${className}`.trim()}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      title={locked ? lockedReason ?? "Bloqueado" : title}
      {...rest}
    >
      {children}
    </button>
  );
}
