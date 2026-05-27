import type { IconProps } from "./types";

export function PlusCircleIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M20.25 11.999C20.25 7.44267 16.5563 3.74902 12 3.74902C7.44365 3.74902 3.75 7.44267 3.75 11.999C3.75 16.5554 7.44365 20.249 12 20.249C16.5563 20.249 20.25 16.5554 20.25 11.999ZM21.75 11.999C21.75 17.3838 17.3848 21.749 12 21.749C6.61522 21.749 2.25 17.3838 2.25 11.999C2.25 6.61425 6.61522 2.24902 12 2.24902C17.3848 2.24902 21.75 6.61425 21.75 11.999Z" fill="currentColor"/>
      <path d="M11.25 15V9C11.25 8.58579 11.5858 8.25 12 8.25C12.4142 8.25 12.75 8.58579 12.75 9V15C12.75 15.4142 12.4142 15.75 12 15.75C11.5858 15.75 11.25 15.4142 11.25 15Z" fill="currentColor"/>
      <path d="M15 11.25C15.4142 11.25 15.75 11.5858 15.75 12C15.75 12.4142 15.4142 12.75 15 12.75H9C8.58579 12.75 8.25 12.4142 8.25 12C8.25 11.5858 8.58579 11.25 9 11.25H15Z" fill="currentColor"/>
    </svg>
  );
}
