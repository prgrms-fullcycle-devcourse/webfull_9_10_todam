import type { IconProps } from "./types";

export function FlagIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M20.6708 12.665C20.7869 12.8974 20.7742 13.1735 20.6376 13.3945C20.501 13.6155 20.2598 13.75 19.9999 13.75L8.74995 13.75L8.74995 21C8.74995 21.4142 8.41416 21.75 7.99995 21.75C7.58573 21.75 7.24995 21.4142 7.24995 21L7.24995 3C7.24995 2.58579 7.58574 2.25 7.99995 2.25C8.41416 2.25 8.74995 2.58579 8.74995 3L8.74995 4.25L19.9999 4.25C20.2598 4.25 20.501 4.38453 20.6376 4.60547C20.7742 4.82646 20.7869 5.10255 20.6708 5.33496L18.8388 9L20.6708 12.665ZM17.329 9.33496C17.2237 9.12403 17.2237 8.87597 17.329 8.66504L18.7871 5.75L8.74995 5.75L8.74995 12.25L18.7871 12.25L17.329 9.33496Z" fill="currentColor"/>
    </svg>
  );
}
