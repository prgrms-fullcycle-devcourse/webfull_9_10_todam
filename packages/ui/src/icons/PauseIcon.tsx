import { useId } from "react";
import type { IconProps } from "./types";

export function PauseIcon({ size = 24, color, className, style, ...props }: IconProps) {
  const clipId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={color ? { color, ...style } : style}
      {...props}
    >
      <g clipPath={`url(#${clipId})`}>
        <path d="M9.25 7C9.25 6.30964 8.69036 5.75 8 5.75H7C6.30964 5.75 5.75 6.30964 5.75 7V17C5.75 17.6904 6.30964 18.25 7 18.25H8C8.69036 18.25 9.25 17.6904 9.25 17V7ZM10.75 17C10.75 18.5188 9.51878 19.75 8 19.75H7C5.48122 19.75 4.25 18.5188 4.25 17V7C4.25 5.48122 5.48122 4.25 7 4.25H8C9.51878 4.25 10.75 5.48122 10.75 7V17Z" fill="currentColor"/>
        <path d="M18.25 7C18.25 6.30964 17.6904 5.75 17 5.75H16C15.3096 5.75 14.75 6.30964 14.75 7V17C14.75 17.6904 15.3096 18.25 16 18.25H17C17.6904 18.25 18.25 17.6904 18.25 17V7ZM19.75 17C19.75 18.5188 18.5188 19.75 17 19.75H16C14.4812 19.75 13.25 18.5188 13.25 17V7C13.25 5.48122 14.4812 4.25 16 4.25H17C18.5188 4.25 19.75 5.48122 19.75 7V17Z" fill="currentColor"/>
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}
