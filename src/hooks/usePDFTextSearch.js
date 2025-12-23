import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Hook to search for text in PDF text layer and calculate highlight positions
 * @param {Array} issues - Array of issues from reviewResult
 * @param {boolean} textLayerReady - Whether text layers are ready
 * @returns {Array} Array of highlight positions with coordinates
 */
const usePDFTextSearch = (issues = [], textLayerReady = false) => {
    const [highlights, setHighlights] = useState([]);
    const isProcessingRef = useRef(false);
    const previousIssuesRef = useRef(null);
    const previousTextLayerReadyRef = useRef(false);
    const issuesRef = useRef(issues);

    // Normalize text for matching (remove punctuation, extra spaces)
    const normalizeText = useCallback((str) => {
        if (!str) return '';
        return str
            .replace(/[.,;:!?\-_()\[\]{}"'`]/g, ' ') // Remove punctuation
            .replace(/\s+/g, ' ') // Multiple spaces to single
            .trim()
            .toLowerCase();
    }, []);

    // Find text position in PDF text layer
    const findTextInPDF = useCallback((searchText, pageIndex) => {
        if (!searchText || !searchText.trim()) return null;

        try {
            // Find text layer element for this page using data attribute
            const pageWrapper = document.querySelector(`.pdf-page-wrapper[data-page-number="${pageIndex + 1}"]`);
            if (!pageWrapper) {
                console.warn(`Page wrapper not found for page ${pageIndex + 1}`);
                return null;
            }

            const textLayer = pageWrapper.querySelector('.react-pdf__Page__textContent');
            if (!textLayer) {
                console.warn(`Text layer not found for page ${pageIndex + 1}`);
                return null;
            }

            // Get all text spans
            const textSpans = textLayer.querySelectorAll('span');
            if (textSpans.length === 0) {
                console.warn(`No text spans found for page ${pageIndex + 1}`);
                return null;
            }

            // Build full text from spans
            let fullText = '';
            const spanMap = [];
            textSpans.forEach((span, idx) => {
                const text = span.textContent || '';
                const start = fullText.length;
                fullText += text;
                const end = fullText.length;
                spanMap.push({ span, start, end, text, index: idx });
            });

            // Normalize search text and full text
            const normalizedSearch = normalizeText(searchText);
            const normalizedFull = normalizeText(fullText);

            // Try exact match first
            let foundIndex = normalizedFull.indexOf(normalizedSearch);
            if (foundIndex === -1) {
                // Try partial match (at least 60% of words match)
                const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
                if (searchWords.length === 0) return null;

                // Find position where most words match
                let bestMatch = null;
                let bestScore = 0;
                const minMatchLength = Math.max(10, normalizedSearch.length * 0.5);

                for (let i = 0; i <= normalizedFull.length - minMatchLength; i++) {
                    for (let len = minMatchLength; len <= Math.min(normalizedSearch.length * 1.5, normalizedFull.length - i); len++) {
                        const substring = normalizedFull.substring(i, i + len);
                        const subWords = substring.split(' ').filter(w => w.length > 2);

                        let matchCount = 0;
                        searchWords.forEach(word => {
                            if (subWords.some(sw => sw.includes(word) || word.includes(sw))) {
                                matchCount++;
                            }
                        });

                        const score = matchCount / searchWords.length;
                        if (score > bestScore && score >= 0.6) {
                            bestScore = score;
                            foundIndex = i;
                            break;
                        }
                    }
                }

                if (foundIndex === -1) return null;
            }

            // Map normalized position back to original spans
            let charCount = 0;
            let startSpan = null;
            let endSpan = null;

            for (const spanInfo of spanMap) {
                const normalizedSpan = normalizeText(spanInfo.text);
                const spanLength = normalizedSpan.length;

                if (!startSpan && charCount + spanLength > foundIndex) {
                    startSpan = spanInfo;
                }

                if (charCount + spanLength >= foundIndex + normalizedSearch.length) {
                    endSpan = spanInfo;
                    break;
                }

                charCount += spanLength;
            }

            if (!startSpan) return null;
            if (!endSpan) endSpan = spanMap[spanMap.length - 1];

            // Calculate bounding box from spans
            const startRect = startSpan.span.getBoundingClientRect();
            const endRect = endSpan.span.getBoundingClientRect();
            const pageRect = pageWrapper.getBoundingClientRect();

            // Calculate position relative to page wrapper
            const left = Math.min(startRect.left, endRect.left) - pageRect.left;
            const top = Math.min(startRect.top, endRect.top) - pageRect.top;
            const right = Math.max(startRect.right, endRect.right) - pageRect.left;
            const bottom = Math.max(startRect.bottom, endRect.bottom) - pageRect.top;

            return {
                left,
                top,
                width: right - left,
                height: bottom - top,
                pageNumber: pageIndex + 1
            };
        } catch (error) {
            console.error('Error finding text in PDF:', error);
            return null;
        }
    }, [normalizeText]);

    // Create a stable reference for issues comparison
    const issuesKey = useMemo(() => {
        if (!issues || issues.length === 0) return null;
        // Create a unique key based on issue content
        return issues.map(issue => 
            `${issue.exact_quote || issue.original_text || ''}-${issue.section || ''}`
        ).join('|');
    }, [issues]);

    // Keep issues ref updated
    useEffect(() => {
        issuesRef.current = issues;
    }, [issues]);

    // Search for all issues when text layer is ready
    useEffect(() => {
        const currentIssues = issuesRef.current;
        
        // Reset highlights if text layer is not ready or no issues
        if (!textLayerReady || !currentIssues || currentIssues.length === 0) {
            setHighlights([]);
            previousIssuesRef.current = null;
            previousTextLayerReadyRef.current = false;
            isProcessingRef.current = false;
            return;
        }

        // Check if we've already processed these exact issues with this textLayerReady state
        const hasChanged = 
            previousIssuesRef.current !== issuesKey || 
            previousTextLayerReadyRef.current !== textLayerReady;

        if (!hasChanged || isProcessingRef.current) {
            return;
        }

        // Mark as processing to prevent concurrent searches
        isProcessingRef.current = true;
        previousIssuesRef.current = issuesKey;
        previousTextLayerReadyRef.current = textLayerReady;

        // Wait a bit more for text layer to fully render
        const timeoutId = setTimeout(() => {
            const foundHighlights = [];

            currentIssues.forEach((issue, issueIndex) => {
                // Use exact_quote if available, fallback to original_text
                const searchText = issue.exact_quote || issue.original_text;
                if (!searchText || !searchText.trim()) {
                    console.warn(`Issue ${issueIndex + 1} has no searchable text`);
                    return;
                }

                // Try to find text on each page (PDF might have multiple pages)
                const pageWrappers = document.querySelectorAll('.pdf-page-wrapper[data-page-number]');
                
                for (let pageIndex = 0; pageIndex < pageWrappers.length; pageIndex++) {
                    const position = findTextInPDF(searchText, pageIndex);
                    if (position) {
                        foundHighlights.push({
                            ...position,
                            issueIndex,
                            issue
                        });
                        console.log(`✅ Found issue ${issueIndex + 1} on page ${position.pageNumber}: "${searchText.substring(0, 50)}..."`);
                        break; // Found on this page, don't search other pages
                    }
                }

                if (!foundHighlights.some(h => h.issueIndex === issueIndex)) {
                    console.warn(`⚠️ Could not find issue ${issueIndex + 1} in PDF: "${searchText.substring(0, 50)}..."`);
                }
            });

            setHighlights(foundHighlights);
            isProcessingRef.current = false;
        }, 500); // Wait 500ms for text layer to be fully ready

        return () => {
            clearTimeout(timeoutId);
            isProcessingRef.current = false;
        };
    }, [issuesKey, textLayerReady, findTextInPDF]);

    return highlights;
};

export default usePDFTextSearch;

