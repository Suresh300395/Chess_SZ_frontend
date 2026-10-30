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

    return `
        <div class="token-container">
            <div class="header">
                <div class="org-name">${escapeHtml(ORGANIZATION_NAME)}</div>
                <div class="event-name">${escapeHtml(token.eventName || EVENT_NAME)}</div>
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
 * CSS stylesheet optimized for 80mm & 58mm thermal printers
 */
const thermalStyles = `
    @page {
        margin: 0;
        size: ${PAPER_WIDTH} auto;
    }
    body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background-color: #ffffff;
        color: #000000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
    .token-container {
        width: calc(${PAPER_WIDTH} - 10mm);
        max-width: 72mm;
        margin: 0 auto;
        padding: 5mm 2mm 3mm 2mm;
        text-align: center;
        page-break-inside: avoid;
        break-inside: avoid;
        box-sizing: border-box;
    }
    .header {
        margin-bottom: 2mm;
    }
    .org-name {
        font-size: 14pt;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .event-name {
        font-size: 8.5pt;
        margin-top: 1mm;
        font-weight: 500;
        line-height: 1.2;
    }
    .divider {
        border-bottom: 1.5px dashed #000000;
        margin: 2.5mm 0;
    }
    .meal-section {
        margin: 2mm 0 3mm 0;
    }
    .meal-badge {
        font-size: 8.5pt;
        font-weight: 700;
        letter-spacing: 1.5px;
    }
    .meal-type {
        font-size: 20pt;
        font-weight: 900;
        margin: 1mm 0;
        letter-spacing: 1.5px;
        text-transform: uppercase;
    }
    .meal-date {
        font-size: 10pt;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
    .qr-section {
        margin: 3mm auto 1mm auto;
        text-align: center;
    }
    .qr-img {
        width: 44mm;
        height: 44mm;
        image-rendering: pixelated;
        display: block;
        margin: 0 auto;
    }
    .token-code {
        font-family: "Courier New", Courier, monospace;
        font-size: 14pt;
        font-weight: 900;
        letter-spacing: 2.5px;
        margin-top: 2mm;
    }
    .cut-strip {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2mm;
        margin-top: 5mm;
        padding-top: 2mm;
        color: #000000;
    }
    .cut-line {
        flex: 1;
        border-bottom: 1.5px dashed #000000;
        height: 0;
    }
    .cut-scissors {
        font-size: 13pt;
        line-height: 1;
        display: inline-block;
    }
    .cut-scissors.left {
        transform: scaleX(-1);
    }
    .cut-text {
        font-size: 6.5pt;
        font-weight: 800;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 0 1mm;
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
                    <style>${thermalStyles}</style>
                </head>
                <body>
                    ${contentHTML}
                </body>
                </html>
            `);
            docElement.close();

            // Wait for images (QR codes) to render, then invoke print dialog
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
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Build QR payload containing token unique ID, participant name, and meal/date details
 */
const buildQRPayload = (token) => {
    const dataObj = {
        code: token.code,
        name: token.name || 'Participant',
        meal: (token.mealType || '').toUpperCase(),
        date: formatDateDDMMYYYY(token.mealDate)
    };
    return JSON.stringify(dataObj);
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
            width: 220,
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
                width: 220,
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
