import type { IconProps } from "./types";

export function SearchIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M18.25 11C18.25 6.99594 15.0041 3.75 11 3.75C6.99594 3.75 3.75 6.99594 3.75 11C3.75 15.0041 6.99594 18.25 11 18.25C13.0022 18.25 14.8141 17.4398 16.127 16.127C17.4398 14.8141 18.25 13.0022 18.25 11ZM19.75 11C19.75 13.1459 18.9752 15.111 17.6934 16.6328L21.5303 20.4697C21.8232 20.7626 21.8232 21.2374 21.5303 21.5303C21.2374 21.8232 20.7626 21.8232 20.4697 21.5303L16.6328 17.6934C15.111 18.9752 13.1459 19.75 11 19.75C6.16751 19.75 2.25 15.8325 2.25 11C2.25 6.16751 6.16751 2.25 11 2.25C15.8325 2.25 19.75 6.16751 19.75 11Z" fill="currentColor"/>
    </svg>
  );
}
