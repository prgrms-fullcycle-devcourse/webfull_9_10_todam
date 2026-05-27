import type { IconProps } from "./types";

export function SendIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M3.65023 6.64555C3.41274 4.50596 5.61477 2.93527 7.56039 3.85649L19.5047 9.51469C21.6017 10.508 21.6017 13.4921 19.5047 14.4854L7.56039 20.1436C5.61478 21.0648 3.41273 19.4941 3.65023 17.3545L4.24496 12L3.65023 6.64555ZM6.91879 5.21293C6.03433 4.79398 5.03337 5.50782 5.14144 6.48051L5.67074 11.25H11.9998C12.4141 11.25 12.7498 11.5858 12.7498 12C12.7498 12.4143 12.4141 12.75 11.9998 12.75H5.67074L5.14144 17.5196C5.03337 18.4923 6.03432 19.2061 6.91879 18.7872L18.8631 13.1299C19.8163 12.6784 19.8163 11.3217 18.8631 10.8702L6.91879 5.21293Z" fill="currentColor"/>
    </svg>
  );
}
