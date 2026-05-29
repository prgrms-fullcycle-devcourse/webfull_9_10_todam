import type { HTMLAttributes } from "react";

export type StepperItemChildImage = {
  src: string;
  alt?: string;
};

export type StepperItemChildProps = {
  title: string;
  date?: string;
  images?: StepperItemChildImage[];
} & HTMLAttributes<HTMLDivElement>;

export function StepperItemChild({
  title,
  date,
  images,
  className,
  ...props
}: StepperItemChildProps) {
  return (
    <div
      className={["flex flex-col gap-3 pb-5", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="flex flex-col gap-1">
        {date && <p className="text-xs text-foreground-tertiary">{date}</p>}
        <p className="text-base font-semibold leading-5 text-foreground">
          {title}
        </p>
      </div>
      {images && images.length > 0 && (
        <div className="flex gap-2">
          {images.map((image, index) => (
            <img
              key={index}
              src={image.src}
              alt={image.alt ?? ""}
              className="h-16 w-16 rounded-lg bg-muted object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
