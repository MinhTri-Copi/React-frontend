/**
 * Utility functions for text processing and fuzzy matching
 * Using Token-Based Matching with Smart Trimming for accurate highlighting
 */

/**
 * Token structure: { text: string, start: number, end: number, type: 'word' | 'punctuation' }
 */

/**
 * Tokenize text into tokens (words and punctuation) while preserving original positions
 * Supports Vietnamese and Unicode characters
 * 
 * @param {string} text - Input text to tokenize
 * @returns {Array<{text: string, start: number, end: number, type: 'word' | 'punctuation'}>} - Array of tokens with positions
 */
export const tokenizeWithPositions = (text) => {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const tokens = [];
    // Regex to match: [Unicode letters/numbers]+ OR [non-space, non-letter/number characters]
    // This handles Vietnamese characters well with \p{L} and \p{N}
    const tokenRegex = /[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu;
    
    let match;
    while ((match = tokenRegex.exec(text)) !== null) {
        const tokenText = match[0];
        const start = match.index;
        const end = start + tokenText.length;
        const type = /[\p{L}\p{N}]/u.test(tokenText) ? 'word' : 'punctuation';
        
        tokens.push({
            text: tokenText,
            start: start,
            end: end,
            type: type
        });
    }

    return tokens;
};

/**
 * Normalize text for comparison:
 * - Convert to lowercase
 * - Remove Vietnamese diacritics (dấu tiếng Việt)
 * - Keep structure for token matching
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
        .trim();
};

/**
 * Normalize a token for comparison (lowercase, remove diacritics)
 * 
 * @param {string} tokenText - Token text to normalize
 * @returns {string} - Normalized token
 */
const normalizeToken = (tokenText) => {
    if (!tokenText) return '';
    return normalizeText(tokenText);
};

/**
 * Calculate similarity between two token arrays
 * Uses token-based comparison for better accuracy
 * 
 * @param {Array<string>} tokens1 - First token array (normalized)
 * @param {Array<string>} tokens2 - Second token array (normalized)
 * @returns {number} - Similarity score between 0 and 1
 */
const calculateTokenSimilarity = (tokens1, tokens2) => {
    if (!tokens1 || !tokens2 || tokens1.length === 0 || tokens2.length === 0) {
        return 0;
    }

    if (tokens1.length === 0 && tokens2.length === 0) return 1;

    // Count exact token matches
    let matches = 0;
    const minLength = Math.min(tokens1.length, tokens2.length);
    const maxLength = Math.max(tokens1.length, tokens2.length);

    for (let i = 0; i < minLength; i++) {
        if (tokens1[i] === tokens2[i]) {
            matches++;
        } else {
            // Check for partial match (one token contains the other)
            const token1 = tokens1[i];
            const token2 = tokens2[i];
            if (token1.includes(token2) || token2.includes(token1)) {
                matches += 0.5; // Partial match
            }
        }
    }

    // Similarity based on matches vs max length
    return matches / maxLength;
};

/**
 * Smart trim highlight result to remove unnecessary punctuation and whitespace at boundaries
 * Ensures highlight is tight around words
 * 
 * @param {string} text - The text to trim
 * @param {number} start - Start position in original text
 * @param {number} end - End position in original text
 * @param {string} originalText - Full original text for context
 * @returns {{start: number, end: number, text: string}} - Trimmed result with adjusted positions
 */
export const trimHighlightResult = (text, start, end, originalText) => {
    if (!text || !originalText) {
        return { start, end, text };
    }

    let trimmedStart = start;
    let trimmedEnd = end;

    // Trim from start: remove leading whitespace and punctuation
    const startTrimRegex = /^[\s.,;:!?\-_()\[\]{}"'`~@#$%^&*+=|\\/<>]+/;
    const startMatch = text.match(startTrimRegex);
    if (startMatch) {
        trimmedStart = start + startMatch[0].length;
    }

    // Trim from end: remove trailing whitespace and punctuation
    const endTrimRegex = /[\s.,;:!?\-_()\[\]{}"'`~@#$%^&*+=|\\/<>]+$/;
    const endMatch = text.match(endTrimRegex);
    if (endMatch) {
        trimmedEnd = end - endMatch[0].length;
    }

    // Ensure we don't trim too much (keep at least one character)
    if (trimmedStart >= trimmedEnd) {
        // If trimming would remove everything, keep original
        trimmedStart = start;
        trimmedEnd = end;
    }

    // Ensure bounds are valid
    trimmedStart = Math.max(0, Math.min(trimmedStart, originalText.length));
    trimmedEnd = Math.max(trimmedStart, Math.min(trimmedEnd, originalText.length));

    const trimmedText = originalText.substring(trimmedStart, trimmedEnd);

    return {
        start: trimmedStart,
        end: trimmedEnd,
        text: trimmedText
    };
};

/**
 * Find the position of searchQuote in fullText using token-based fuzzy matching
 * 
 * Algorithm:
 * 1. Tokenize both texts while preserving positions
 * 2. Use sliding window on tokens (not characters) to find best match
 * 3. Accept matches with >75% similarity
 * 4. Apply smart trimming to remove boundary punctuation/whitespace
 * 
 * @param {string} fullText - The full text to search in
 * @param {string} searchQuote - The text to find
 * @returns {{start: number, end: number} | null} - Position in original text, or null if not found
 */
export const findFuzzyLocation = (fullText, searchQuote) => {
    if (!fullText || !searchQuote || typeof fullText !== 'string' || typeof searchQuote !== 'string') {
        return null;
    }

    if (searchQuote.trim().length === 0) {
        return null;
    }

    // Step 1: Tokenize both texts
    const fullTextTokens = tokenizeWithPositions(fullText);
    const searchTokens = tokenizeWithPositions(searchQuote);

    if (fullTextTokens.length === 0 || searchTokens.length === 0) {
        // Fallback to character-based matching if tokenization fails
        return findFuzzyLocationFallback(fullText, searchQuote);
    }

    // Step 2: Normalize tokens for comparison
    const normalizedSearchTokens = searchTokens
        .filter(token => token.type === 'word') // Only match on words, ignore punctuation
        .map(token => normalizeToken(token.text));

    if (normalizedSearchTokens.length === 0) {
        return null;
    }

    // Step 3: Sliding window on tokens
    const minSimilarity = 0.75; // 75% accuracy threshold
    const searchTokenCount = normalizedSearchTokens.length;
    const minWindowSize = Math.max(1, Math.floor(searchTokenCount * 0.5)); // At least 50% of tokens
    const maxWindowSize = Math.min(searchTokenCount * 2, fullTextTokens.length); // At most 2x tokens

    let bestMatch = null;
    let bestSimilarity = 0;

    // Sliding window: try different starting positions
    for (let startIdx = 0; startIdx <= fullTextTokens.length - minWindowSize; startIdx++) {
        // Try different window sizes
        for (let windowSize = minWindowSize; windowSize <= Math.min(maxWindowSize, fullTextTokens.length - startIdx); windowSize++) {
            // Extract tokens in this window
            const windowTokens = fullTextTokens.slice(startIdx, startIdx + windowSize);
            const normalizedWindowTokens = windowTokens
                .filter(token => token.type === 'word')
                .map(token => normalizeToken(token.text));

            if (normalizedWindowTokens.length === 0) continue;

            // Calculate similarity
            const similarity = calculateTokenSimilarity(normalizedSearchTokens, normalizedWindowTokens);

            if (similarity > bestSimilarity && similarity >= minSimilarity) {
                bestSimilarity = similarity;
                // Get actual text positions from tokens
                const firstToken = windowTokens[0];
                const lastToken = windowTokens[windowTokens.length - 1];
                bestMatch = {
                    start: firstToken.start,
                    end: lastToken.end
                };
            }
        }
    }

    if (bestMatch) {
        // Step 4: Apply smart trimming to remove boundary punctuation/whitespace
        const matchedText = fullText.substring(bestMatch.start, bestMatch.end);
        const trimmed = trimHighlightResult(matchedText, bestMatch.start, bestMatch.end, fullText);
        
        return {
            start: trimmed.start,
            end: trimmed.end
        };
    }

    // Fallback to character-based matching if token matching fails
    return findFuzzyLocationFallback(fullText, searchQuote);
};

/**
 * Fallback character-based fuzzy matching (original algorithm)
 * Used when token-based matching fails
 * 
 * @param {string} fullText - The full text to search in
 * @param {string} searchQuote - The text to find
 * @returns {{start: number, end: number} | null} - Position in original text, or null if not found
 */
const findFuzzyLocationFallback = (fullText, searchQuote) => {
    if (!fullText || !searchQuote) {
        return null;
    }

    // Normalize both texts
    const normalizedFull = normalizeText(fullText);
    const normalizedSearch = normalizeText(searchQuote);
    
    if (normalizedSearch.length === 0) {
        return null;
    }

    // Try exact match first
    const exactIndex = normalizedFull.indexOf(normalizedSearch);
    if (exactIndex !== -1) {
        // Map normalized position back to original text
        return mapNormalizedToOriginal(fullText, normalizedFull, exactIndex, normalizedSearch.length);
    }

    // Sliding window approach for fuzzy matching
    const minSimilarity = 0.7;
    const searchLength = normalizedSearch.length;
    const minWindowLength = Math.max(10, Math.floor(searchLength * 0.5));
    const maxWindowLength = Math.min(searchLength * 2, normalizedFull.length);

    let bestMatch = null;
    let bestSimilarity = 0;

    for (let start = 0; start <= normalizedFull.length - minWindowLength; start++) {
        for (let windowLength = minWindowLength; windowLength <= Math.min(maxWindowLength, normalizedFull.length - start); windowLength++) {
            const window = normalizedFull.substring(start, start + windowLength);
            const similarity = calculateSimilarity(normalizedSearch, window);
            
            if (similarity > bestSimilarity && similarity >= minSimilarity) {
                bestSimilarity = similarity;
                bestMatch = { start, length: windowLength };
            }
        }
    }

    if (bestMatch) {
        const result = mapNormalizedToOriginal(fullText, normalizedFull, bestMatch.start, bestMatch.length);
        // Apply smart trimming
        const matchedText = fullText.substring(result.start, result.end);
        return trimHighlightResult(matchedText, result.start, result.end, fullText);
    }

    return null;
};

/**
 * Calculate similarity between two strings using character-based comparison
 * (Used in fallback method)
 * 
 * @param {string} str1 - First string (normalized)
 * @param {string} str2 - Second string (normalized)
 * @returns {number} - Similarity score between 0 and 1
 */
const calculateSimilarity = (str1, str2) => {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

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
 * (Used in fallback method)
 * 
 * @param {string} originalText - Original text with original formatting
 * @param {string} normalizedText - Normalized version of originalText
 * @param {number} normalizedStart - Start position in normalized text
 * @param {number} normalizedLength - Length in normalized text
 * @returns {{start: number, end: number}} - Position in original text
 */
const mapNormalizedToOriginal = (originalText, normalizedText, normalizedStart, normalizedLength) => {
    let normalizedIndex = 0;
    const charMap = [];
    
    for (let i = 0; i < originalText.length; i++) {
        const char = originalText[i];
        const charLower = char.toLowerCase();
        const normalizedChar = charLower
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[.,;:!?\-_()\[\]{}"'`~@#$%^&*+=|\\/<>]/g, '')
            .trim();
        
        if (normalizedChar.length > 0 && /[a-z0-9]/.test(normalizedChar)) {
            charMap.push({ original: i, normalized: normalizedIndex });
            normalizedIndex++;
        } else if (/\s/.test(char)) {
            charMap.push({ original: i, normalized: -1 });
        } else {
            charMap.push({ original: i, normalized: -1 });
        }
    }
    
    let start = 0;
    for (let i = 0; i < charMap.length; i++) {
        if (charMap[i].normalized === normalizedStart) {
            start = charMap[i].original;
            break;
        } else if (charMap[i].normalized > normalizedStart) {
            for (let j = i - 1; j >= 0; j--) {
                if (charMap[j].normalized >= 0) {
                    start = charMap[j].original;
                    break;
                }
            }
            break;
        }
    }
    
    let end = originalText.length;
    const normalizedEnd = normalizedStart + normalizedLength;
    
    for (let i = 0; i < charMap.length; i++) {
        if (charMap[i].normalized >= normalizedEnd) {
            end = charMap[i].original;
            break;
        }
    }
    
    start = Math.max(0, Math.min(start, originalText.length));
    end = Math.max(start, Math.min(end, originalText.length));
    
    return { start, end };
};
