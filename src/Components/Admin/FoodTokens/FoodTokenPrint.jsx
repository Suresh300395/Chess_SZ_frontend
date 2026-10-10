import QRCode from 'qrcode';
import { ORGANIZATION_NAME, EVENT_NAME, PAPER_WIDTH } from '../../../config/foodTokenConfig';
import { formatDateDDMMYYYY } from '../../../utils/dateUtils';

/**
 * Generate HTML markup for a single 80mm thermal food token receipt
 */
const generateTokenHTML = (token, qrDataUrl) => {
    const isReprint = Boolean(token.isReprint || (token.printCount && token.printCount > 1));
    const locationInfo = [token.block, token.room ? `Room ${token.room}` : ''].filter(Boolean).join(' - ');

    return `
        <div class="token-container">
            <div class="header">
                <div class="org-name">${ORGANIZATION_NAME}</div>
                <div class="event-name">${token.eventName || EVENT_NAME}</div>
                <div class="divider"></div>
            </div>

            <div class="meal-section">
                <div class="meal-badge">FOOD TOKEN</div>
                <div class="meal-type">${(token.mealType || '').toUpperCase()}</div>
                <div class="meal-date">${formatDateDDMMYYYY(token.mealDate)}</div>
            </div>

            <div class="details-section">
                <div class="row">
                    <span class="label">Name:</span>
                    <span class="value name-val">${token.name || 'Participant'}</span>
                </div>
                ${token.identifier ? `
                <div class="row">
                    <span class="label">ID/Mobile:</span>
                    <span class="value">${token.identifier}</span>
                </div>` : ''}
                ${token.teamOrSport ? `
                <div class="row">
                    <span class="label">Team:</span>
                    <span class="value">${token.teamOrSport}</span>
                </div>` : ''}
                ${locationInfo ? `
                <div class="row">
                    <span class="label">Stay:</span>
                    <span class="value">${locationInfo}</span>
                </div>` : ''}
            </div>

            <div class="qr-section">
                <img src="${qrDataUrl}" alt="QR Code" class="qr-img" />
                <div class="token-code">${token.code}</div>
            </div>

            <div class="footer">
                <div class="validity">Valid for one-time use only</div>
                ${isReprint ? `<div class="reprint-badge">*** REPRINT (Copy #${token.printCount}) ***</div>` : ''}
                <div class="timestamp">Printed: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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
        padding: 5mm 2mm;
        text-align: center;
        page-break-after: always;
        break-after: page;
        box-sizing: border-box;
    }
    .token-container:last-child {
        page-break-after: avoid;
        break-after: avoid;
    }
    .header {
        margin-bottom: 3mm;
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
        margin: 2mm 0;
    }
    .meal-badge {
        font-size: 8pt;
        font-weight: 700;
        letter-spacing: 1px;
    }
    .meal-type {
        font-size: 19pt;
        font-weight: 900;
        margin: 1mm 0;
        letter-spacing: 1px;
        text-transform: uppercase;
    }
    .meal-date {
        font-size: 9.5pt;
        font-weight: 600;
    }
    .details-section {
        border-top: 1px dashed #000000;
        border-bottom: 1px dashed #000000;
        padding: 2.5mm 1mm;
        margin: 2.5mm 0;
        text-align: left;
        font-size: 9pt;
    }
    .row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1mm;
        line-height: 1.2;
    }
    .label {
        font-weight: 700;
        width: 32%;
    }
    .value {
        font-weight: 500;
        width: 68%;
        word-break: break-word;
    }
    .name-val {
        font-weight: 800;
        font-size: 9.5pt;
    }
    .qr-section {
        margin: 3mm auto 1mm auto;
        text-align: center;
    }
    .qr-img {
        width: 38mm;
        height: 38mm;
        image-rendering: pixelated;
        display: block;
        margin: 0 auto;
    }
    .token-code {
        font-family: "Courier New", Courier, monospace;
        font-size: 14pt;
        font-weight: 900;
        letter-spacing: 2.5px;
        margin-top: 1.5mm;
    }
    .footer {
        margin-top: 3mm;
        font-size: 8pt;
        line-height: 1.3;
    }
    .validity {
        font-weight: 700;
        text-transform: uppercase;
        font-size: 8pt;
        margin-bottom: 1mm;
    }
    .reprint-badge {
        font-weight: 800;
        font-size: 8pt;
        margin-top: 1mm;
    }
    .timestamp {
        font-size: 7pt;
        color: #444;
        margin-top: 1mm;
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
 * Print a single food token
 * @param {Object} token - Token payload
 */
export const printFoodToken = async (token) => {
    try {
        if (!token || !token.code) throw new Error('Invalid token payload for printing');
        const qrDataUrl = await QRCode.toDataURL(token.code, {
            width: 200,
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
            const qrDataUrl = await QRCode.toDataURL(token.code, {
                width: 200,
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
