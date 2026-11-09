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
 * Generate HTML markup for a single 80mm thermal food token receipt
 */
const generateTokenHTML = (token, qrDataUrl) => {
    const safeQr = (typeof qrDataUrl === 'string' && qrDataUrl.startsWith('data:image/')) ? qrDataUrl : '';
    const rawEvent = token.eventName || EVENT_NAME || 'South Zone Inter-University Chess (Men) Tournament';
    const displayEventName = (rawEvent && rawEvent.toLowerCase().includes('(men)'))
        ? rawEvent
        : rawEvent.replace(/Chess Tournament/i, 'Chess (Men) Tournament');

    return `
        <div class="token-container">
            <div class="token-body">
                <div class="header">
                    <div class="org-name">${escapeHtml(ORGANIZATION_NAME)}</div>
                    <div class="event-name">${escapeHtml(displayEventName)}</div>
                    <div class="divider"></div>
                </div>

                <div class="meal-section">
                    <div class="meal-badge">FOOD TOKEN</div>
                    <div class="meal-type">${escapeHtml((token.mealType || '').toUpperCase())}</div>
                    <div class="meal-date">${escapeHtml(formatDateDDMMYYYY(token.mealDate))}</div>
                </div>

                <div class="qr-section">
                    <img src="${safeQr}" alt="QR Code" class="qr-img" />
                    <div class="token-code">${escapeHtml(token.code)}</div>
                </div>
            </div>

            <!-- Tear-off cut strip with scissors -->
            <div class="cut-strip">
                <span class="cut-scissors left">&#x2702;</span>
                <span class="cut-line"></span>
                <span class="cut-text">TEAR HERE</span>
                <span class="cut-line"></span>
                <span class="cut-scissors right">&#x2702;</span>
            </div>
        </div>
    `;
};

/**
 * CSS stylesheet optimized for 80mm * 80mm square food tokens with IBM Plex Mono font
 */
const thermalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
    @page {
        margin: 0;
        size: 80mm 80mm;
    }
    html, body {
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace !important;
        background-color: #ffffff;
        color: #000000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .token-container {
        width: 100%;
        max-width: 72mm;
        height: 80mm;
        max-height: 80mm;
        margin: 0 auto;
        padding: 2mm 2mm 1.5mm 2mm;
        text-align: center;
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-after: always;
        break-after: page;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        overflow: hidden;
        font-family: 'IBM Plex Mono', monospace;
    }
    .token-container:last-child {
        page-break-after: auto;
        break-after: auto;
    }
    @media print {
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            font-family: 'IBM Plex Mono', monospace !important;
        }
    }
    .token-body {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .header {
        width: 100%;
        margin-bottom: 0;
    }
    .org-name {
        font-size: 10pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        line-height: 1.2;
    }
    .event-name {
        font-size: 6.8pt;
        margin-top: 0.3mm;
        font-weight: 600;
        line-height: 1.15;
        letter-spacing: -0.1px;
    }
    .divider {
        border-bottom: 1.2px dashed #000000;
        margin: 0.8mm 0 0.6mm 0;
        width: 100%;
    }
    .meal-section {
        margin: 0;
        padding-top: 0.2mm;
        width: 100%;
    }
    .meal-badge {
        font-size: 7.5pt;
        font-weight: 600;
        letter-spacing: 1.2px;
        line-height: 1;
        margin-bottom: 0.2mm;
    }
    .meal-type {
        font-size: 14pt;
        font-weight: 700;
        margin: 0.2mm 0;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        line-height: 1.1;
    }
    .meal-date {
        font-size: 8.5pt;
        font-weight: 600;
        letter-spacing: 0.5px;
        line-height: 1;
    }
    .qr-section {
        margin: 1mm auto 0 auto;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .qr-img {
        width: 40mm;
        height: 40mm;
        image-rendering: pixelated;
        display: block;
        margin: 0 auto;
    }
    .token-code {
        font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
        font-size: 10.5pt;
        font-weight: 700;
        letter-spacing: 2px;
        margin-top: 0.8mm;
        line-height: 1;
    }
    .cut-strip {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5mm;
        width: 100%;
        margin-top: auto;
        padding-top: 1mm;
        color: #000000;
        font-family: 'IBM Plex Mono', monospace;
    }
    .cut-line {
        flex: 1;
        border-bottom: 1.2px dashed #000000;
        height: 0;
    }
    .cut-scissors {
        font-size: 10pt;
        line-height: 1;
        display: inline-block;
    }
    .cut-scissors.left {
        transform: scaleX(-1);
    }
    .cut-text {
        font-size: 6.2pt;
        font-weight: 700;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        padding: 0 1mm;
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
            docElement.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Print Food Token</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
                    <style>${thermalStyles}</style>
                </head>
                <body>
                    ${contentHTML}
                </body>
                </html>
            `);
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
            width: 300,
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
                width: 300,
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
