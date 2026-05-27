import type { IconProps } from "./types";

export function LeftIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M13.4697 6.46967C13.7626 6.17678 14.2373 6.17678 14.5302 6.46967C14.8231 6.76256 14.8231 7.23732 14.5302 7.53022L10.0605 11.9999L14.5302 16.4697C14.8231 16.7626 14.8231 17.2373 14.5302 17.5302C14.2373 17.8231 13.7626 17.8231 13.4697 17.5302L8.46967 12.5302C8.17678 12.2373 8.17678 11.7626 8.46967 11.4697L13.4697 6.46967Z" fill="currentColor"/>
    </svg>
  );
}
