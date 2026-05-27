import { useId } from "react";
import type { IconProps } from "./types";

export function DuplicateIcon({ size = 24, color, className, style, ...props }: IconProps) {
  const clipId = useId();
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
      <g clipPath={`url(#${clipId})`}>
        <path d="M3.25 16V3C3.25 2.58579 3.58579 2.25 4 2.25H16C16.4142 2.25 16.75 2.58579 16.75 3C16.75 3.41421 16.4142 3.75 16 3.75H4.75V16C4.75 16.4142 4.41421 16.75 4 16.75C3.58579 16.75 3.25 16.4142 3.25 16Z" fill="currentColor"/>
        <path d="M19.25 7.75H8.75V19C8.75 19.6904 9.30964 20.25 10 20.25H18C18.6904 20.25 19.25 19.6904 19.25 19V7.75ZM20.75 19C20.75 20.5188 19.5188 21.75 18 21.75H10C8.48122 21.75 7.25 20.5188 7.25 19V7C7.25 6.58579 7.58579 6.25 8 6.25H20C20.4142 6.25 20.75 6.58579 20.75 7V19Z" fill="currentColor"/>
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}
