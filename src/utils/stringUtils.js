/**
 * Utility functions for text processing and fuzzy matching
 */

/**
 * Normalize text for comparison:
 * - Convert to lowercase
 * - Remove Vietnamese diacritics (dấu tiếng Việt)
 * - Remove all special characters
 * - Collapse multiple spaces to single space
 * 
 * @param {string} str - Input string
 * @returns {string} - Normalized string
 */
export const normalizeText = (str) => {
    if (!str || typeof str !== 'string') return '';
    
    return str
        .toLowerCase()
        // Remove Vietnamese diacritics
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritical marks
        // Remove all special characters and punctuation
        .replace(/[.,;:!?\-_()\[\]{}"'`~@#$%^&*+=|\\/<>]/g, ' ')
        // Collapse multiple spaces/newlines/tabs to single space
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Find the position of searchQuote in fullText using fuzzy matching
 * 
 * Algorithm:
 * 1. Try exact match first (after normalization)
 * 2. If not found, use sliding window to find best match (>70% similarity)
 * 
 * @param {string} fullText - The full text to search in
 * @param {string} searchQuote - The text to find
 * @returns {{start: number, end: number} | null} - Position in original text, or null if not found
 */
export const findFuzzyLocation = (fullText, searchQuote) => {
    if (!fullText || !searchQuote || typeof fullText !== 'string' || typeof searchQuote !== 'string') {
        return null;
    }

    // Step 1: Try exact match (after normalization)
    const normalizedFull = normalizeText(fullText);
    const normalizedSearch = normalizeText(searchQuote);
    
    if (normalizedSearch.length === 0) {
        return null;
    }

    // Try exact match in normalized text
    const exactIndex = normalizedFull.indexOf(normalizedSearch);
    if (exactIndex !== -1) {
        // Map normalized position back to original text
        return mapNormalizedToOriginal(fullText, normalizedFull, exactIndex, normalizedSearch.length);
    }

    // Step 2: Sliding window approach for fuzzy matching
    // Find substring with highest similarity (threshold > 70%)
    const minSimilarity = 0.7;
    const searchLength = normalizedSearch.length;
    const minWindowLength = Math.max(10, Math.floor(searchLength * 0.5)); // At least 50% of search length
    const maxWindowLength = Math.min(searchLength * 2, normalizedFull.length); // At most 2x search length

    let bestMatch = null;
    let bestSimilarity = 0;

    // Sliding window: try different starting positions
    for (let start = 0; start <= normalizedFull.length - minWindowLength; start++) {
        // Try different window sizes
        for (let windowLength = minWindowLength; windowLength <= Math.min(maxWindowLength, normalizedFull.length - start); windowLength++) {
            const window = normalizedFull.substring(start, start + windowLength);
            
            // Calculate similarity using character-based comparison
            const similarity = calculateSimilarity(normalizedSearch, window);
            
            if (similarity > bestSimilarity && similarity >= minSimilarity) {
                bestSimilarity = similarity;
                bestMatch = { start, length: windowLength };
            }
        }
    }

    if (bestMatch) {
        // Map normalized position back to original text
        return mapNormalizedToOriginal(fullText, normalizedFull, bestMatch.start, bestMatch.length);
    }

    return null;
};

/**
 * Calculate similarity between two strings using character-based comparison
 * Uses a combination of:
 * - Character overlap ratio
 * - Word overlap ratio (if applicable)
 * 
 * @param {string} str1 - First string (normalized)
 * @param {string} str2 - Second string (normalized)
 * @returns {number} - Similarity score between 0 and 1
 */
const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    // Character-based similarity (Levenshtein-like, simplified)
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;

    // Count matching characters (in order)
    let matches = 0;
    let shorterIndex = 0;
    
    for (let i = 0; i < longer.length && shorterIndex < shorter.length; i++) {
        if (longer[i] === shorter[shorterIndex]) {
            matches++;
            shorterIndex++;
        }
    }

    const charSimilarity = matches / longer.length;

    // Word-based similarity
    const words1 = str1.split(' ').filter(w => w.length > 2);
    const words2 = str2.split(' ').filter(w => w.length > 2);
    
    if (words1.length === 0 || words2.length === 0) {
        return charSimilarity;
    }

    let wordMatches = 0;
    for (const word1 of words1) {
        if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
            wordMatches++;
        }
    }

    const wordSimilarity = wordMatches / Math.max(words1.length, words2.length);

    // Combined similarity (weighted: 60% character, 40% word)
    return charSimilarity * 0.6 + wordSimilarity * 0.4;
};

/**
 * Map normalized text position back to original text position
 * 
 * @param {string} originalText - Original text with original formatting
 * @param {string} normalizedText - Normalized version of originalText
 * @param {number} normalizedStart - Start position in normalized text
 * @param {number} normalizedLength - Length in normalized text
 * @returns {{start: number, end: number}} - Position in original text
 */
const mapNormalizedToOriginal = (originalText, normalizedText, normalizedStart, normalizedLength) => {
    // Build character map by processing original text character by character
    // and tracking which characters contribute to normalized text
    let normalizedIndex = 0;
    const charMap = [];
    
    for (let i = 0; i < originalText.length; i++) {
        const char = originalText[i];
        // Normalize this single character
        const charLower = char.toLowerCase();
        const normalizedChar = charLower
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[.,;:!?\-_()\[\]{}"'`~@#$%^&*+=|\\/<>]/g, '') // Remove special chars
            .trim();
        
        // If character contributes to normalized text (is alphanumeric)
        if (normalizedChar.length > 0 && /[a-z0-9]/.test(normalizedChar)) {
            charMap.push({ original: i, normalized: normalizedIndex });
            normalizedIndex++;
        } else if (/\s/.test(char)) {
            // Whitespace: might be collapsed, but we track it
            charMap.push({ original: i, normalized: -1 });
        } else {
            // Other characters (punctuation, etc.) - skip in normalized
            charMap.push({ original: i, normalized: -1 });
        }
    }
    
    // Find start position in original text
    let start = 0;
    for (let i = 0; i < charMap.length; i++) {
        if (charMap[i].normalized === normalizedStart) {
            start = charMap[i].original;
            break;
        } else if (charMap[i].normalized > normalizedStart) {
            // Use previous valid position if exact match not found
            for (let j = i - 1; j >= 0; j--) {
                if (charMap[j].normalized >= 0) {
                    start = charMap[j].original;
                    break;
                }
            }
            break;
        }
    }
    
    // Find end position in original text
    let end = originalText.length;
    const normalizedEnd = normalizedStart + normalizedLength;
    
    for (let i = 0; i < charMap.length; i++) {
        if (charMap[i].normalized >= normalizedEnd) {
            end = charMap[i].original;
            break;
        }
    }
    
    // Ensure valid range
    start = Math.max(0, Math.min(start, originalText.length));
    end = Math.max(start, Math.min(end, originalText.length));
    
    return { start, end };
};

