import QRCode from 'qrcode';

/**
 * Generates a pure vector SVG string representation of a QR code.
 * 100% offline, zero-network, crystal-clear vector rendering for PDF invoices.
 */
export async function generateQrSvg(value: string, size: number = 130): Promise<string> {
  try {
    const svg = await QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      width: size,
      errorCorrectionLevel: 'M',
    });
    return svg;
  } catch (e) {
    console.log('Error generating QR SVG:', e);
    return '';
  }
}
