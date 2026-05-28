'use client';

import { Header as BaseHeader, type HeaderProps } from '../../../components/Header';
import { useHeader } from '../model/useHeader';

type WidgetHeaderProps = Omit<Partial<HeaderProps>, 'type'>;

export function Header(props: WidgetHeaderProps) {
    const header = useHeader();
    if (!header.visible) return null;

    return <BaseHeader type={header.type} title={header.title} onBack={header.onBack} {...props} />;
}
