import type { IconProps } from "./types";

export function HeartFillIcon({ size = 24, color, className, style, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-foreground${className ? ` ${className}` : ""}`}
      style={color ? { color, ...style } : style}
      {...props}
    >
      <path d="M12 4.75807C14.347 3.04226 17.6585 3.24467 19.7784 5.36452C22.121 7.70761 22.1211 11.5059 19.7784 13.8489L14.1221 19.5061C12.9506 20.6776 11.0505 20.6774 9.87894 19.5061L4.22269 13.8489C1.87955 11.5057 1.87955 7.70766 4.22269 5.36452C6.34247 3.2449 9.65315 3.04251 12 4.75807Z" fill="currentColor"/>
    </svg>
  );
}
