import { useId } from "react";
import type { IconProps } from "./types";

export function PlayIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
        <path d="M19.375 9.61799C21.2083 10.6765 21.2083 13.3232 19.375 14.3817L10.375 19.578C8.54174 20.6362 6.2501 19.3129 6.25 17.1961L6.25 6.80354C6.2501 4.68674 8.54173 3.36343 10.375 4.4217L19.375 9.61799ZM18.625 13.0828C19.4583 12.6017 19.4583 11.3979 18.625 10.9168L9.625 5.72151C8.79171 5.24041 7.7501 5.84137 7.75 6.80354L7.75 17.1961C7.7501 18.1583 8.7917 18.7593 9.625 18.2781L18.625 13.0828Z" fill="currentColor"/>
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  );
}
