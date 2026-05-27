import type { IconProps } from "./types";

export function CameraIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M20.25 5.75H3.75V17C3.75 17.6904 4.30964 18.25 5 18.25H19C19.6904 18.25 20.25 17.6904 20.25 17V5.75ZM21.75 17C21.75 18.5188 20.5188 19.75 19 19.75H5C3.48122 19.75 2.25 18.5188 2.25 17V5C2.25 4.58579 2.58579 4.25 3 4.25H21C21.4142 4.25 21.75 4.58579 21.75 5V17Z" fill="currentColor"/>
      <path d="M14.25 12C14.25 10.7574 13.2426 9.75 12 9.75C10.7574 9.75 9.75 10.7574 9.75 12C9.75 13.2426 10.7574 14.25 12 14.25C13.2426 14.25 14.25 13.2426 14.25 12ZM15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12Z" fill="currentColor"/>
      <path d="M17 1.25L19 1.25C19.4142 1.25 19.75 1.58579 19.75 2C19.75 2.41421 19.4142 2.75 19 2.75L17 2.75C16.5858 2.75 16.25 2.41421 16.25 2C16.25 1.58579 16.5858 1.25 17 1.25Z" fill="currentColor"/>
    </svg>
  );
}
