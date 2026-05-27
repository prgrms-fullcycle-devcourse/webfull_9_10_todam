import type { IconProps } from "./types";

export function PrintIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M19.25 16V7.75H4.75V16C4.75 16.6904 5.30964 17.25 6 17.25H8V18.75H6C4.48122 18.75 3.25 17.5188 3.25 16V7C3.25 6.58579 3.58579 6.25 4 6.25H20C20.4142 6.25 20.75 6.58579 20.75 7V16C20.75 17.5188 19.5188 18.75 18 18.75H16V17.25H18C18.6904 17.25 19.25 16.6904 19.25 16Z" fill="currentColor"/>
      <path d="M16 2.25C16.4142 2.25 16.75 2.58579 16.75 3V7C16.75 7.41421 16.4142 7.75 16 7.75H8C7.58579 7.75 7.25 7.41421 7.25 7V3C7.25 2.58579 7.58579 2.25 8 2.25H16ZM8.75 6.25H15.25V3.75H8.75V6.25Z" fill="currentColor"/>
      <path d="M8 11.75C7.58579 11.75 7.25 11.4142 7.25 11C7.25 10.5858 7.58579 10.25 8 10.25H12C12.4142 10.25 12.75 10.5858 12.75 11C12.75 11.4142 12.4142 11.75 12 11.75H8Z" fill="currentColor"/>
      <path d="M16 14.25C16.4142 14.25 16.75 14.5858 16.75 15V21C16.75 21.4142 16.4142 21.75 16 21.75H8C7.58579 21.75 7.25 21.4142 7.25 21V15C7.25 14.5858 7.58579 14.25 8 14.25H16ZM8.75 20.25H15.25V15.75H8.75V20.25Z" fill="currentColor"/>
    </svg>
  );
}
