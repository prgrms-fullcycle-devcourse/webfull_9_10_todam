export type DividerProps = {
  className?: string;
};

export function Divider({ className }: DividerProps) {
  return (
    <div className={["py-2 w-full", className].filter(Boolean).join(" ")}>
      <hr className="border-t border-border-subtle" />
    </div>
  );
}
