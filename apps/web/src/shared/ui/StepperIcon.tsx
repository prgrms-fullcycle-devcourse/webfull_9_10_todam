import type { ComponentType, HTMLAttributes } from 'react';
import { CheckIcon, LeafIcon } from '@todam/ui';

export type StepperIconShape = 'square' | 'circle';
export type StepperIconStatus = 'completed' | 'current' | 'upcoming';

export type StepperIconProps = {
    shape?: StepperIconShape;
    status?: StepperIconStatus;
    icon?: ComponentType<{ size?: number }>;
} & HTMLAttributes<HTMLSpanElement>;

const shapeClasses: Record<StepperIconShape, string> = {
    circle: 'h-7 w-7 rounded-full',
    square: 'h-12 w-12 rounded-xl',
};

const iconSize: Record<StepperIconShape, number> = {
    circle: 16,
    square: 20,
};

const statusClasses: Record<StepperIconStatus, string> = {
    completed: 'border border-success bg-success text-foreground-inverse',
    current: 'border border-info-darker bg-info-subtle text-info-darker',
    upcoming: 'border border-border bg-surface text-foreground-tertiary',
};

export function StepperIcon({
    shape = 'circle',
    status = 'upcoming',
    icon: Icon = LeafIcon,
    className,
    ...props
}: StepperIconProps) {
    const size = iconSize[shape];
    const icon = status === 'completed' ? <CheckIcon size={size} /> : <Icon size={size} />;

    return (
        <span
            className={[
                'inline-flex items-center justify-center',
                shapeClasses[shape],
                statusClasses[status],
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            {...props}
        >
            {icon}
        </span>
    );
}
