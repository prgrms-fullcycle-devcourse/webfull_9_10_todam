import type { IconProps } from "./types";

export function RightIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M10.5303 17.5303C10.2374 17.8232 9.76268 17.8232 9.46978 17.5303C9.17689 17.2374 9.17689 16.7627 9.46978 16.4698L13.9395 12.0001L9.46978 7.53033C9.17689 7.23744 9.17689 6.76267 9.46978 6.46978C9.76268 6.17689 10.2374 6.17689 10.5303 6.46978L15.5303 11.4698C15.8232 11.7627 15.8232 12.2374 15.5303 12.5303L10.5303 17.5303Z" fill="currentColor"/>
    </svg>
  );
}
