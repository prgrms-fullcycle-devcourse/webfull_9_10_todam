import { jsPDF } from 'jspdf';

// QR 라벨 PDF 생성(브라우저 전용). 서버/S3 미사용 — decision: docs/exec-plans/active/partner-qr-pdf.md (결정 3)
//
// jsPDF 기본 폰트(helvetica)는 한글 글리프가 없어 라벨 텍스트가 깨진다. 그래서
// 라벨 전체(QR + 한글 텍스트)를 <canvas> 2D 컨텍스트로 그린 뒤(시스템 폰트로 한글 렌더)
// 단일 이미지로 PDF에 임베드한다. 별도 폰트 임베드/추가 의존성 불필요.

export type QrLabelData = {
    qrImageUrl: string; // qrcode.toDataURL 결과(PNG dataURL)
    artworkId: string;
    reservationNumber: string;
    programTitle: string;
    scheduledText: string; // "2026. 05. 13 (수) 13:00"
    participantText: string; // "2명"
    reserverName: string;
};

const SCALE = 3; // 인쇄 선명도용 캔버스 배율
const W = 360; // 논리 폭(px)
const PAD = 24;

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function drawRow(ctx: CanvasRenderingContext2D, label: string, value: string, y: number): void {
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#434A54';
    ctx.font = '400 14px Pretendard, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, PAD, y);

    ctx.fillStyle = '#191E25';
    ctx.font = '600 14px Pretendard, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(value, W - PAD, y);
}

// 라벨을 캔버스에 렌더 → dataURL + 실제 픽셀 크기 반환.
async function renderLabelCanvas(data: QrLabelData): Promise<{
    dataUrl: string;
    width: number;
    height: number;
}> {
    // Pretendard 로드 완료 후 그려야 캔버스 텍스트가 폴백 폰트로 깨지지 않는다.
    if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready;
    }

    const qrSize = W - PAD * 2;
    const headerH = 84; // 예약번호 라벨 + 값
    const rowsTop = headerH + qrSize + 28;
    const rowGap = 36;
    const rows = 4;
    const H = rowsTop + rowGap * rows + PAD;

    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d context unavailable');
    ctx.scale(SCALE, SCALE);

    // 배경(흰색 — 인쇄 기본).
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // 예약 번호 라벨 + 값(중앙 정렬).
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#434A54';
    ctx.font = '400 16px Pretendard, system-ui, sans-serif';
    ctx.fillText('예약 번호', W / 2, 32);
    ctx.fillStyle = '#191E25';
    ctx.font = '700 24px Pretendard, system-ui, sans-serif';
    ctx.fillText(data.reservationNumber, W / 2, 66);

    // QR 이미지.
    const qr = await loadImage(data.qrImageUrl);
    ctx.drawImage(qr, PAD, headerH, qrSize, qrSize);

    // 정보 행.
    drawRow(ctx, '클래스', data.programTitle, rowsTop);
    drawRow(ctx, '체험일시', data.scheduledText, rowsTop + rowGap);
    drawRow(ctx, '인원', data.participantText, rowsTop + rowGap * 2);
    drawRow(ctx, '예약자', data.reserverName, rowsTop + rowGap * 3);

    return { dataUrl: canvas.toDataURL('image/png'), width: W, height: H };
}

// 라벨 PDF를 생성하고 다운로드(저장)한다. 파일명 qr-label-{artworkId}.pdf
export async function generateQrLabelPdf(data: QrLabelData): Promise<void> {
    const label = await renderLabelCanvas(data);

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;
    const imgW = pageW - margin * 2;
    const imgH = (label.height / label.width) * imgW;

    doc.addImage(label.dataUrl, 'PNG', margin, margin, imgW, imgH);
    doc.save(`qr-label-${data.artworkId}.pdf`);
}
