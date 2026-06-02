import type { SVGProps } from 'react';

export type IconProps = {
    size?: number;
    color?: string;
} & Omit<SVGProps<SVGSVGElement>, 'width' | 'height' | 'color'>;
