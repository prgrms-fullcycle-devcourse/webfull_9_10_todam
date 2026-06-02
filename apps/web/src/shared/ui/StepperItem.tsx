import type { HTMLAttributes } from 'react';
import { StepperIcon, type StepperIconStatus } from './StepperIcon';

export type StepperItemStatus = StepperIconStatus;

export type StepperItemProps = {
    status?: StepperItemStatus;
    isLast?: boolean;
} & HTMLAttributes<HTMLDivElement>;

const connectorClasses: Record<StepperItemStatus, string> = {
    completed: 'bg-success-lighter',
    current: 'bg-muted',
    upcoming: 'bg-muted',
};

export function StepperItem({
    status = 'upcoming',
    isLast = false,
    className,
    ...props
}: StepperItemProps) {
    return (
        <div
            className={['flex h-full w-7 flex-col items-center', className]
                .filter(Boolean)
                .join(' ')}
            {...props}
        >
            <StepperIcon shape="circle" status={status} className="shrink-0" />
            {!isLast && <div className={`w-0.5 flex-1 ${connectorClasses[status]}`} />}
        </div>
    );
}
