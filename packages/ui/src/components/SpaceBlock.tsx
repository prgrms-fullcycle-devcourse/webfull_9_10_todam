export type SpaceBlockSize = 4 | 8 | 16 | 20;

export type SpaceBlockProps = {
  size?: SpaceBlockSize;
};

const heightMap: Record<SpaceBlockSize, string> = {
  4: "h-1",
  8: "h-2",
  16: "h-4",
  20: "h-5",
};

export function SpaceBlock({ size = 4 }: SpaceBlockProps) {
  return <div className={`w-full ${heightMap[size]}`} />;
}
