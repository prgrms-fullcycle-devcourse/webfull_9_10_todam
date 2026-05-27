import type { IconProps } from "./types";

export function InformationIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M20.25 12C20.25 7.44365 16.5563 3.75 12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25C16.5563 20.25 20.25 16.5563 20.25 12ZM21.75 12C21.75 17.3848 17.3848 21.75 12 21.75C6.61522 21.75 2.25 17.3848 2.25 12C2.25 6.61522 6.61522 2.25 12 2.25C17.3848 2.25 21.75 6.61522 21.75 12Z" fill="currentColor"/>
      <path d="M12.0098 6.875C12.6311 6.875 13.1348 7.37868 13.1348 8V8.00977C13.1348 8.63109 12.6311 9.13477 12.0098 9.13477H12C11.3787 9.13477 10.875 8.63109 10.875 8.00977V8C10.875 7.37868 11.3787 6.875 12 6.875H12.0098Z" fill="currentColor"/>
      <path d="M11.25 16V12C11.25 11.5858 11.5858 11.25 12 11.25C12.4142 11.25 12.75 11.5858 12.75 12V16C12.75 16.4142 12.4142 16.75 12 16.75C11.5858 16.75 11.25 16.4142 11.25 16Z" fill="currentColor"/>
    </svg>
  );
}
