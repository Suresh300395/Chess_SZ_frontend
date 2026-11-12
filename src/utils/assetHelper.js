/**
 * Resolves a public asset path by prefixing Vite's base URL (import.meta.env.BASE_URL).
 * Handles paths with or without leading slashes, external URLs, and data URLs.
 * 
 * @param {string} path - e.g. '/hero.png' or 'ADITYA LOGO2.png'
 * @returns {string} - e.g. '/chess-men/hero.png'
 */
export const getAssetUrl = (path) => {
    if (!path) return '';
    if (
        path.startsWith('http://') ||
        path.startsWith('https://') ||
        path.startsWith('data:') ||
        path.startsWith('blob:')
    ) {
        return path;
    }
    const base = import.meta.env.BASE_URL || '/';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return `${cleanBase}${cleanPath}`;
};

export default getAssetUrl;

