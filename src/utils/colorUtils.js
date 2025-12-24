/**
 * Color utility functions for CV Review highlighting
 * Provides consistent color palette based on issue index
 */

/**
 * Get color for issue based on index
 * Uses a palette of 15 pastel colors that are distinct but not too bright
 * Colors rotate if index > 15
 * 
 * @param {number} index - Issue index (0, 1, 2, ...)
 * @returns {string} HEX color code
 */
export const getIssueColor = (index) => {
    // Palette of 15 pastel colors - distinct, readable, not too bright
    const colors = [
        '#FF6B6B', // Red - Coral
        '#4ECDC4', // Teal - Turquoise
        '#45B7D1', // Blue - Sky Blue
        '#FFA07A', // Orange - Light Salmon
        '#98D8C8', // Green - Mint
        '#F7DC6F', // Yellow - Light Yellow
        '#BB8FCE', // Purple - Lavender
        '#85C1E2', // Light Blue
        '#F1948A', // Pink - Salmon Pink
        '#52BE80', // Green - Emerald
        '#F8B739', // Orange - Amber
        '#5DADE2', // Blue - Cornflower
        '#EC7063', // Red - Light Red
        '#A569BD', // Purple - Medium Purple
        '#48C9B0', // Teal - Medium Turquoise
    ];
    
    // Rotate colors if index exceeds palette length
    return colors[index % colors.length];
};

/**
 * Convert HEX color to RGBA with custom opacity
 * 
 * @param {string} hex - HEX color code (e.g., '#FF6B6B')
 * @param {number} alpha - Opacity value (0-1)
 * @returns {string} RGBA color string
 */
export const hexToRgba = (hex, alpha = 1) => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Get highlight style for issue based on index
 * Returns object with backgroundColor (20% opacity) and borderColor (100% opacity)
 * 
 * @param {number} index - Issue index
 * @returns {Object} Style object with backgroundColor and borderColor
 */
export const getIssueHighlightStyle = (index) => {
    const color = getIssueColor(index);
    return {
        backgroundColor: hexToRgba(color, 0.2), // 20% opacity for background
        borderColor: color, // 100% opacity for border
        borderBottomColor: color,
    };
};

