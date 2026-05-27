import type { IconProps } from "./types";

export function EmailIcon({ size = 24, color, className, style, ...props }: IconProps) {
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
      <path d="M20.25 5.75H3.75V17C3.75 17.6904 4.30964 18.25 5 18.25H19C19.6904 18.25 20.25 17.6904 20.25 17V5.75ZM21.75 17C21.75 18.5188 20.5188 19.75 19 19.75H5C3.48122 19.75 2.25 18.5188 2.25 17V5C2.25 4.58579 2.58579 4.25 3 4.25H21C21.4142 4.25 21.75 4.58579 21.75 5V17Z" fill="currentColor"/>
      <path d="M20.4697 4.46967C20.7626 4.17678 21.2373 4.17678 21.5302 4.46967C21.8231 4.76256 21.8231 5.23732 21.5302 5.53022L12.5302 14.5302C12.2373 14.8231 11.7626 14.8231 11.4697 14.5302L2.46967 5.53022C2.17678 5.23732 2.17678 4.76256 2.46967 4.46967C2.76256 4.17678 3.23732 4.17678 3.53022 4.46967L11.9999 12.9394L20.4697 4.46967Z" fill="currentColor"/>
    </svg>
  );
}
