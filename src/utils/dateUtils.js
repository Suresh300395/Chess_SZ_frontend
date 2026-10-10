/**
 * Formats any date string, timestamp, or Date object into strict "DD-MM-YYYY" format.
 * Examples:
 * - "2026-11-14" -> "14-11-2026"
 * - "2026-11-14T09:30:00.000Z" -> "14-11-2026"
 * - "14-11-2026" -> "14-11-2026"
 * - "14/11/2026" -> "14-11-2026"
 * - new Date() -> "10-10-2026"
 */
export const formatDateDDMMYYYY = (dateVal) => {
    if (!dateVal) return '—';

    if (typeof dateVal === 'string') {
        const trimmed = dateVal.trim();
        if (!trimmed) return '—';

        // Check if already in DD-MM-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
            return trimmed;
        }

        // Check if DD/MM/YYYY
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
            return trimmed.replace(/\//g, '-');
        }

        // Check if YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            const datePart = trimmed.split('T')[0];
            const parts = datePart.split('-');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
    }

    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateVal);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    } catch {
        return String(dateVal);
    }
};

/**
 * Returns today's date formatted as DD-MM-YYYY.
 */
export const getTodayDDMMYYYY = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};
