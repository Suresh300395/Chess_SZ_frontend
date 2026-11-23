import QRCode from 'qrcode';
import { ORGANIZATION_NAME, EVENT_NAME, PAPER_WIDTH } from '../../../config/foodTokenConfig';
import { formatDateDDMMYYYY } from '../../../utils/dateUtils';

/**
 * Safely escape dynamic values for HTML rendering to prevent XSS
 */
const escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

/**
 * Generate HTML markup for a single 80mm thermal food token receipt (Height: 2 inch / 50.8mm)
 * Layout matches exact 2-column format: Left has FOOD TOKEN, MEAL TYPE, DATE; Right has QR & CODE.
 */
const generateTokenHTML = (token, qrDataUrl) => {
    const safeQr = (typeof qrDataUrl === 'string' && qrDataUrl.startsWith('data:image/')) ? qrDataUrl : '';
    const rawEvent = token.eventName || EVENT_NAME || 'South Zone Inter-University Chess (Men) Tournament';
    const displayEventName = (rawEvent && rawEvent.toLowerCase().includes('(men)'))
        ? rawEvent
        : rawEvent.replace(/Chess Tournament/i, 'Chess (Men) Tournament');

    return `<div class="token-container"><div class="header"><div class="org-name">${escapeHtml(ORGANIZATION_NAME)}</div><div class="event-name">${escapeHtml(displayEventName)}</div><div class="divider"></div></div><div class="token-body"><div class="meal-col"><div class="meal-badge">FOOD TOKEN</div><div class="meal-type">${escapeHtml((token.mealType || '').toUpperCase())}</div><div class="meal-date">${escapeHtml(formatDateDDMMYYYY(token.mealDate))}</div></div><div class="qr-col"><img src="${safeQr}" alt="QR Code" class="qr-img" /><div class="token-code">${escapeHtml(token.code)}</div></div></div><!-- Tear-off cut strip with scissors --><div class="cut-strip"><span class="cut-line edge"></span><span class="cut-scissors left">&#x2702;</span><span class="cut-line"></span><span class="cut-text">TEAR HERE</span><span class="cut-line"></span><span class="cut-scissors right">&#x2702;</span><span class="cut-line edge"></span></div></div>`.trim();
};

/**
 * CSS stylesheet optimized for 80mm thermal food tokens with Portrait orientation & IBM Plex Mono font
 */
const thermalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
    
    @page {
        margin: 0 !important;
        size: portrait;
    }

    *, *::before, *::after {
        box-sizing: border-box;
    }

    html, body {
        margin: 0 !important;
        padding: 0 !important;
        font-size: 0 !important;
        line-height: 0 !important;
        width: 80mm !important;
        height: auto !important;
        min-height: 0 !important;
        background-color: #ffffff;
        color: #000000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    .token-container {
        width: 80mm;
        max-width: 80mm;
        height: auto;
        min-height: 0;
        max-height: 50.8mm;
        margin: 0 auto;
        padding: 0 2mm 0.5mm 2mm;
        text-align: center;
        page-break-before: avoid !important;
        break-before: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: always;
        break-after: page;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        overflow: hidden;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10pt;
        line-height: 1.2;
    }

    .token-container:first-child {
        page-break-before: avoid !important;
        break-before: avoid !important;
    }

    .token-container:last-child {
        page-break-after: auto !important;
        break-after: auto !important;
    }

    @media print {
        @page {
            margin: 0 !important;
            size: portrait;
        }
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            height: auto !important;
            min-height: 0 !important;
            font-size: 0 !important;
            line-height: 0 !important;
            font-family: 'IBM Plex Mono', monospace !important;
        }
        .token-container {
            width: 80mm !important;
            max-width: 80mm !important;
            height: auto !important;
            max-height: 50.8mm !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 2mm 0.5mm 2mm !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
        }
        .token-container:first-child {
            page-break-before: avoid !important;
            break-before: avoid !important;
        }
        .token-container:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
        }
    }

    .header {
        width: 100%;
        text-align: center;
        margin: 0;
        padding-top: 0;
    }

    .org-name {
        font-size: 9.5pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        line-height: 1.15;
    }

    .event-name {
        font-size: 6.2pt;
        margin-top: 0.2mm;
        font-weight: 600;
        line-height: 1.15;
        letter-spacing: -0.1px;
    }

    .divider {
        border-bottom: 1.2px dashed #000000;
        margin: 0.6mm 0 0.4mm 0;
        width: 100%;
    }

    .token-body {
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        min-height: 0;
        padding: 0 0.5mm;
        box-sizing: border-box;
    }

    .meal-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding-right: 1.5mm;
    }

    .meal-badge {
        font-size: 7.5pt;
        font-weight: 700;
        letter-spacing: 2px;
        line-height: 1;
        text-transform: uppercase;
        margin-bottom: 0.6mm;
    }

    .meal-type {
        font-size: 14.5pt;
        font-weight: 800;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        line-height: 1;
        margin: 0.2mm 0;
    }

    .meal-date {
        font-size: 9pt;
        font-weight: 700;
        letter-spacing: 0.5px;
        line-height: 1;
        margin-top: 0.6mm;
    }

    .qr-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        flex-shrink: 0;
    }

    .qr-img {
        width: 26mm;
        height: 26mm;
        image-rendering: pixelated;
        display: block;
        margin: 0 auto;
    }

    .token-code {
        font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
        font-size: 9pt;
        font-weight: 700;
        letter-spacing: 1.6px;
        margin-top: 0.5mm;
        line-height: 1;
    }

    .cut-strip {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0.4mm 0 0 0;
        padding: 0;
        box-sizing: border-box;
        color: #000000;
        font-family: 'IBM Plex Mono', monospace;
    }

    .cut-line {
        flex: 1;
        border-bottom: 1.2px dashed #000000;
        height: 0;
    }

    .cut-line.edge {
        flex: 0 0 2mm;
        width: 2mm;
    }

    .cut-scissors {
        font-size: 8.5pt;
        line-height: 1;
        display: inline-block;
        padding: 0 0.8mm;
    }

    .cut-scissors.left {
        transform: scaleX(-1);
    }

    .cut-text {
        font-size: 6pt;
        font-weight: 700;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        padding: 0 1.2mm;
        white-space: nowrap;
    }
`;

/**
 * Executes iframe-based silent/native printing
 */
const executeIframePrint = (contentHTML) => {
    return new Promise((resolve, reject) => {
        try {
            // Remove any existing print iframe
            const existingFrame = document.getElementById('food-token-print-frame');
            if (existingFrame) existingFrame.remove();

            const iframe = document.createElement('iframe');
            iframe.id = 'food-token-print-frame';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';

            document.body.appendChild(iframe);

            const doc = iframe.contentWindow || iframe.contentDocument;
            const docElement = doc.document || doc;

            docElement.open();
            docElement.write(`<!DOCTYPE html><html><head><title>Print Food Token</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet"><style>${thermalStyles}</style></head><body>${contentHTML.trim()}</body></html>`);
            docElement.close();

            const triggerPrint = () => {
                setTimeout(() => {
                    try {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                        resolve(true);
                    } catch (e) {
                        reject(e);
                    } finally {
                        setTimeout(() => {
                            if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
                        }, 5000);
                    }
                }, 350);
            };

            // Ensure fonts & images are ready before triggering print
            if (docElement.fonts && docElement.fonts.ready) {
                docElement.fonts.ready.then(triggerPrint).catch(triggerPrint);
            } else {
                triggerPrint();
            }
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Build QR payload - encodes ONLY the unique token code so scanning displays just the code
 */
const buildQRPayload = (token) => {
    return String(token.code || '').trim();
};

/**
 * Print a single food token
 * @param {Object} token - Token payload
 */
export const printFoodToken = async (token) => {
    try {
        if (!token || !token.code) throw new Error('Invalid token payload for printing');
        const qrContent = buildQRPayload(token);
        const qrDataUrl = await QRCode.toDataURL(qrContent, {
            width: 250,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M'
        });

        const html = generateTokenHTML(token, qrDataUrl);
        await executeIframePrint(html);
        return true;
    } catch (err) {
        console.error('Failed to print food token:', err);
        throw err;
    }
};

/**
 * Print multiple food tokens in a single print job (e.g. for team/bulk issue)
 * @param {Array} tokens - Array of token payloads
 */
export const printMultipleFoodTokens = async (tokens) => {
    try {
        if (!tokens || !tokens.length) throw new Error('No tokens to print');

        const htmlSnippets = [];
        for (const token of tokens) {
            const qrContent = buildQRPayload(token);
            const qrDataUrl = await QRCode.toDataURL(qrContent, {
                width: 250,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'M'
            });
            htmlSnippets.push(generateTokenHTML(token, qrDataUrl));
        }

        const combinedHTML = htmlSnippets.join('');
        await executeIframePrint(combinedHTML);
        return true;
    } catch (err) {
        console.error('Failed to print multiple food tokens:', err);
        throw err;
    }
};
