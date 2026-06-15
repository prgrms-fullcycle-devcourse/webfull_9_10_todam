'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { BottomBar, Button } from '@todam/ui';
import { formatScheduled, formatYmdWithDay } from '@todam/shared';

import { ApiError } from '@/shared/api';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';
import { useToast } from '@/shared/model';

import { usePartnerReservationDetail } from '@/entities/reservation';

import { buildArtworkDetailUrl } from '../lib/artworkDetailUrl';
import { generateQrLabelPdf } from '../lib/generateQrLabelPdf';

type PartnerReservationQrClientProps = {
    reservationId: string;
};

type InfoRow = { label: string; value: string };

function MessageScreen({ message }: { message: string }) {
    return (
        <main className="flex-1 overflow-y-auto px-4 pb-16">
            <p className="py-10 text-center text-sm text-foreground-tertiary">{message}</p>
        </main>
    );
}

export function PartnerReservationQrClient({ reservationId }: PartnerReservationQrClientProps) {
    const router = useRouter();
    const { push: pushToast } = useToast();
    const { data, error, isError, isLoading } = usePartnerReservationDetail(reservationId);
    const reservation = data?.reservation;

    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useHeaderOverride({
        type: 'popup',
        onClose: () => router.back(),
    });

    const artworkId = reservation?.artworkId ?? null;

    // 작품 상세 URL → QR dataURL. origin 은 빌드 env(없으면 현재 origin) 사용.
    const artworkUrl = useMemo(() => {
        if (!artworkId || typeof window === 'undefined') return null;
        const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        return buildArtworkDetailUrl(origin, artworkId);
    }, [artworkId]);

    useEffect(() => {
        if (!artworkUrl) return;
        let alive = true;
        QRCode.toDataURL(artworkUrl, { width: 640, margin: 1 })
            .then((url) => {
                if (alive) setQrImageUrl(url);
            })
            .catch(() => {
                if (alive) setQrImageUrl(null);
            });
        return () => {
            alive = false;
        };
    }, [artworkUrl]);

    const rows = useMemo<InfoRow[]>(() => {
        if (!reservation) return [];
        const { time } = formatScheduled(reservation.scheduledAt);
        return [
            { label: '클래스', value: reservation.programTitle },
            { label: '체험일시', value: `${formatYmdWithDay(reservation.scheduledAt)} ${time}` },
            { label: '인원', value: `${reservation.participantCount}명` },
            { label: '예약자', value: reservation.reserverName },
        ];
    }, [reservation]);

    const handlePrint = async () => {
        if (!reservation || !artworkId || !qrImageUrl || isSaving) return;
        const { time } = formatScheduled(reservation.scheduledAt);
        setIsSaving(true);
        try {
            await generateQrLabelPdf({
                qrImageUrl,
                artworkId,
                reservationNumber: reservation.reservationNumber,
                programTitle: reservation.programTitle,
                scheduledText: `${formatYmdWithDay(reservation.scheduledAt)} ${time}`,
                participantText: `${reservation.participantCount}명`,
                reserverName: reservation.reserverName,
            });
        } catch {
            pushToast({ message: 'PDF 저장에 실패했습니다.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <MessageScreen message="QR 정보를 불러오는 중입니다." />;
    }

    if (isError && error instanceof ApiError) {
        if (error.statusCode === 401) return null;
        const message =
            error.statusCode === 404
                ? '예약을 찾을 수 없습니다.'
                : error.statusCode === 403
                  ? '해당 예약에 대한 접근 권한이 없습니다.'
                  : 'QR 정보를 불러오지 못했습니다.';
        return <MessageScreen message={message} />;
    }

    if (!reservation) {
        return <MessageScreen message="예약 정보를 불러오지 못했습니다." />;
    }

    // 작품 미생성(artworkId null) 예약 → QR 생성 불가 안내.
    if (!artworkId) {
        return <MessageScreen message="아직 작품이 생성되지 않은 예약이에요." />;
    }

    return (
        <>
            <main className="flex-1 overflow-y-auto px-4 pb-6">
                <section className="flex flex-col items-center gap-4 py-2">
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-lg text-foreground-secondary">예약 번호</p>
                        <p className="text-2xl font-bold text-foreground">
                            {reservation.reservationNumber}
                        </p>
                    </div>

                    <div className="aspect-square w-full overflow-hidden rounded-3xl p-4 bg-surface">
                        {qrImageUrl ? (
                            <img
                                src={qrImageUrl}
                                alt="작품 상세 QR 코드"
                                className="h-full w-full object-contain"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-foreground-tertiary">
                                QR 코드를 생성하는 중입니다.
                            </div>
                        )}
                    </div>
                </section>

                <dl className="w-full">
                    {rows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between py-3">
                            <dt className="text-sm text-foreground-secondary">{row.label}</dt>
                            <dd className="text-sm font-semibold text-foreground">{row.value}</dd>
                        </div>
                    ))}
                </dl>
            </main>

            <BottomBar>
                <Button
                    className="h-14 w-full"
                    disabled={!qrImageUrl || isSaving}
                    onClick={handlePrint}
                >
                    {isSaving ? '저장 중...' : '인쇄하기'}
                </Button>
            </BottomBar>
        </>
    );
}
