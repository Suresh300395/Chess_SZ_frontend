export const ORGANIZATION_NAME = 'Aditya University';
export const EVENT_NAME = 'South Zone Inter-University Chess Tournament';
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
export const PAPER_WIDTH = '80mm'; // Standard 80mm thermal receipt width (or '58mm')

// Expiration cutoff times for each meal
// Breakfast: 10:00 AM
// Lunch: 2:00 PM (14:00)
// Snacks: 6:00 PM (18:00)
// Dinner: 9:00 PM (21:00)
export const MEAL_EXPIRY_TIMES = {
    'Breakfast': { hour: 10, minute: 0, label: '10:00 AM' },
    'Lunch': { hour: 14, minute: 0, label: '2:00 PM' },
    'Snacks': { hour: 18, minute: 0, label: '6:00 PM' },
    'Dinner': { hour: 21, minute: 0, label: '9:00 PM' }
};

/**
 * Returns the expiry cutoff Date object for a meal on a given date.
 */
export const parseMealExpiryDateTime = (mealDateStr, mealType) => {
    if (!mealDateStr || typeof mealDateStr !== 'string') return null;
    const trimmed = mealDateStr.trim();
    let y, m, d;

    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const datePart = trimmed.split('T')[0];
        const parts = datePart.split('-');
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10) - 1;
        d = parseInt(parts[2], 10);
    } else if (/^\d{2}[-/]\d{2}[-/]\d{4}/.test(trimmed)) {
        const datePart = trimmed.split('T')[0];
        const parts = datePart.split(/[-/]/);
        d = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10) - 1;
        y = parseInt(parts[2], 10);
    } else {
        const dt = new Date(trimmed);
        if (isNaN(dt.getTime())) return null;
        y = dt.getFullYear();
        m = dt.getMonth();
        d = dt.getDate();
    }

    const typeLower = (mealType || '').trim().toLowerCase();
    const cutoff = typeLower.includes('breakfast') ? { hour: 10, minute: 0 }
        : typeLower.includes('lunch') ? { hour: 14, minute: 0 }
        : typeLower.includes('snack') ? { hour: 18, minute: 0 }
        : typeLower.includes('dinner') ? { hour: 21, minute: 0 }
        : { hour: 23, minute: 59 };

    return new Date(y, m, d, cutoff.hour, cutoff.minute, 0, 0);
};

/**
 * Checks if a token has expired based on mealDate and mealType cutoff
 */
export const isMealTokenExpired = (mealDateStr, mealType) => {
    const expiry = parseMealExpiryDateTime(mealDateStr, mealType);
    if (!expiry) return false;
    return Date.now() > expiry.getTime();
};

/**
 * Returns human-readable cutoff string, e.g. "Expires at 10:00 AM"
 */
export const getMealExpiryCutoffLabel = (mealType) => {
    const typeLower = (mealType || '').trim().toLowerCase();
    if (typeLower.includes('breakfast')) return '10:00 AM';
    if (typeLower.includes('lunch')) return '2:00 PM';
    if (typeLower.includes('snack')) return '6:00 PM';
    if (typeLower.includes('dinner')) return '9:00 PM';
    return '11:59 PM';
};
