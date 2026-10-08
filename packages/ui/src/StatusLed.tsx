export type LedColor = "green" | "yellow" | "red" | "off";

export interface StatusLedProps {
  color: LedColor;
  label?: string;
  blink?: boolean;
}

export function StatusLed({ color, label, blink = false }: StatusLedProps) {
  return (
    <span className={`smart-led smart-led--${color}${blink ? " smart-led--blink" : ""}`} role="status">
      <span className="smart-led__dot" aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  );
}
