import type { ReactNode } from "react";

export type SectionProps = {
  gap?: string;
  align?: string;
  children: ReactNode;
  className?: string;
};

export function Section({
  gap = "gap-3",
  align = "items-center",
  children,
  className,
}: SectionProps) {
  return (
    <section
      className={["flex flex-col py-2 w-full", gap, align, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
