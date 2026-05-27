import type { IconProps } from "./types";

export function BookmarkFillIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M16 2C17.6569 2 19 3.34315 19 5V21C19 21.3466 18.8202 21.6684 18.5254 21.8506C18.2306 22.0327 17.8626 22.0495 17.5527 21.8946L12 19.1182L6.44727 21.8946C6.13735 22.0495 5.76939 22.0327 5.47461 21.8506C5.17979 21.6684 5 21.3466 5 21V5C5 3.34315 6.34315 2 8 2H16Z" fill="currentColor"/>
    </svg>
  );
}
