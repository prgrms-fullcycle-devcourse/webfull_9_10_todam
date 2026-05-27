import type { IconProps } from "./types";

export function DownIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M6.46967 10.5303C6.17678 10.2374 6.17678 9.76268 6.46967 9.46978C6.76256 9.17689 7.23732 9.17689 7.53022 9.46978L11.9999 13.9395L16.4697 9.46978C16.7626 9.17689 17.2373 9.17689 17.5302 9.46978C17.8231 9.76268 17.8231 10.2374 17.5302 10.5303L12.5302 15.5303C12.2373 15.8232 11.7626 15.8232 11.4697 15.5303L6.46967 10.5303Z" fill="currentColor"/>
    </svg>
  );
}
