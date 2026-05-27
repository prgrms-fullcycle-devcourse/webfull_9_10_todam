import type { IconProps } from "./types";

export function BookmarkIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M17.25 5C17.25 4.30964 16.6904 3.75 16 3.75H8C7.30964 3.75 6.75 4.30964 6.75 5V19.7861L11.665 17.3291L11.7451 17.2949C11.937 17.2255 12.1502 17.2368 12.335 17.3291L17.25 19.7861V5ZM18.75 21C18.75 21.2598 18.6155 21.501 18.3945 21.6377C18.1735 21.7743 17.8974 21.7869 17.665 21.6709L12 18.8379L6.33496 21.6709C6.10255 21.7869 5.82646 21.7743 5.60547 21.6377C5.38453 21.501 5.25 21.2598 5.25 21V5C5.25 3.48122 6.48122 2.25 8 2.25H16C17.5188 2.25 18.75 3.48122 18.75 5V21Z" fill="currentColor"/>
    </svg>
  );
}
