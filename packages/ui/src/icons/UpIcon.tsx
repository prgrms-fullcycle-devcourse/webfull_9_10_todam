import type { IconProps } from "./types";

export function UpIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M17.5303 13.4697C17.8232 13.7626 17.8232 14.2373 17.5303 14.5302C17.2374 14.8231 16.7627 14.8231 16.4698 14.5302L12.0001 10.0605L7.53033 14.5302C7.23744 14.8231 6.76268 14.8231 6.46978 14.5302C6.17689 14.2373 6.17689 13.7626 6.46978 13.4697L11.4698 8.46967C11.7627 8.17678 12.2374 8.17678 12.5303 8.46967L17.5303 13.4697Z" fill="currentColor"/>
    </svg>
  );
}
