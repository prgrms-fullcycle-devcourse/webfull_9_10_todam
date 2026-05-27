import type { IconProps } from "./types";

export function UserIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M19.25 18C19.25 16.2051 17.7949 14.75 16 14.75H8C6.20507 14.75 4.75 16.2051 4.75 18C4.75 18.6904 5.30964 19.25 6 19.25H18C18.6904 19.25 19.25 18.6904 19.25 18ZM20.75 18C20.75 19.5188 19.5188 20.75 18 20.75H6C4.48122 20.75 3.25 19.5188 3.25 18C3.25 15.3766 5.37665 13.25 8 13.25H16C18.6234 13.25 20.75 15.3766 20.75 18Z" fill="currentColor"/>
      <path d="M14.25 7C14.25 5.75736 13.2426 4.75 12 4.75C10.7574 4.75 9.75 5.75736 9.75 7C9.75 8.24264 10.7574 9.25 12 9.25C13.2426 9.25 14.25 8.24264 14.25 7ZM15.75 7C15.75 9.07107 14.0711 10.75 12 10.75C9.92893 10.75 8.25 9.07107 8.25 7C8.25 4.92893 9.92893 3.25 12 3.25C14.0711 3.25 15.75 4.92893 15.75 7Z" fill="currentColor"/>
    </svg>
  );
}
