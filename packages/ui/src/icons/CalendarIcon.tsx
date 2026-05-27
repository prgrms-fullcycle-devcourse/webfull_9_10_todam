import type { IconProps } from "./types";

export function CalendarIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M19.25 4.75H4.75V18C4.75 18.6904 5.30964 19.25 6 19.25H18C18.6904 19.25 19.25 18.6904 19.25 18V4.75ZM20.75 18C20.75 19.5188 19.5188 20.75 18 20.75H6C4.48122 20.75 3.25 19.5188 3.25 18V4C3.25 3.58579 3.58579 3.25 4 3.25H20C20.4142 3.25 20.75 3.58579 20.75 4V18Z" fill="currentColor"/>
      <path d="M20 7.25C20.4142 7.25 20.75 7.58579 20.75 8C20.75 8.41421 20.4142 8.75 20 8.75H4C3.58579 8.75 3.25 8.41421 3.25 8C3.25 7.58579 3.58579 7.25 4 7.25H20Z" fill="currentColor"/>
      <path d="M15.25 5V3C15.25 2.58579 15.5858 2.25 16 2.25C16.4142 2.25 16.75 2.58579 16.75 3V5C16.75 5.41421 16.4142 5.75 16 5.75C15.5858 5.75 15.25 5.41421 15.25 5Z" fill="currentColor"/>
      <path d="M7.25 5V3C7.25 2.58579 7.58579 2.25 8 2.25C8.41421 2.25 8.75 2.58579 8.75 3V5C8.75 5.41421 8.41421 5.75 8 5.75C7.58579 5.75 7.25 5.41421 7.25 5Z" fill="currentColor"/>
    </svg>
  );
}
