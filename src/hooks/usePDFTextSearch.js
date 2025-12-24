import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { normalizeText, findFuzzyLocation } from '../utils/stringUtils';

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

    // Find text position in PDF text layer using fuzzy matching
    // Memoized to prevent unnecessary re-renders
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

            // Build full text from spans (preserve spaces between spans)
            let fullText = '';
            const spanMap = [];
            textSpans.forEach((span, idx) => {
                const text = span.textContent || '';
                // Add space if previous span didn't end with space and this doesn't start with space
                // This helps with text that might be split across spans
                if (fullText.length > 0 && 
                    !fullText.endsWith(' ') && 
                    !text.startsWith(' ') &&
                    text.length > 0) {
                    fullText += ' ';
                }
                const start = fullText.length;
                fullText += text;
                const end = fullText.length;
                spanMap.push({ span, start, end, text, index: idx });
            });

            // Use fuzzy matching to find text position
            const position = findFuzzyLocation(fullText, searchText);
            if (!position) {
                return null;
            }

            // Map position back to original spans
            // Find spans that contain the start and end positions
            let startSpan = null;
            let endSpan = null;

            for (const spanInfo of spanMap) {
                // Check if this span contains the start position
                if (!startSpan && spanInfo.start <= position.start && spanInfo.end > position.start) {
                    startSpan = spanInfo;
                }

                // Check if this span contains or passes the end position
                if (spanInfo.start < position.end && spanInfo.end >= position.end) {
                    endSpan = spanInfo;
                    break;
                }
            }

            // If exact match not found, use closest spans
            if (!startSpan) {
                // Find the first span that starts after or at position.start
                for (const spanInfo of spanMap) {
                    if (spanInfo.start >= position.start) {
                        startSpan = spanInfo;
                        break;
                    }
                }
                // If still not found, use first span
                if (!startSpan && spanMap.length > 0) {
                    startSpan = spanMap[0];
                }
            }

            if (!endSpan) {
                // Find the last span that ends before or at position.end
                for (let i = spanMap.length - 1; i >= 0; i--) {
                    if (spanMap[i].end <= position.end) {
                        endSpan = spanMap[i];
                        break;
                    }
                }
                // If still not found, use last span
                if (!endSpan && spanMap.length > 0) {
                    endSpan = spanMap[spanMap.length - 1];
                }
            }

            if (!startSpan || !endSpan) return null;

            // Calculate bounding box from spans
            // Get all spans between start and end (inclusive)
            const allSpans = [];
            const startIndex = spanMap.findIndex(s => s === startSpan);
            const endIndex = spanMap.findIndex(s => s === endSpan);
            
            if (startIndex !== -1 && endIndex !== -1) {
                for (let i = startIndex; i <= endIndex; i++) {
                    if (spanMap[i]) {
                        allSpans.push(spanMap[i].span);
                    }
                }
            }

            // Calculate bounding box from all spans
            if (allSpans.length === 0) {
                // Fallback to startSpan only
                allSpans.push(startSpan.span);
            }

            // Get bounding boxes relative to page wrapper
            const pageRect = pageWrapper.getBoundingClientRect();
            let minLeft = Infinity;
            let minTop = Infinity;
            let maxRight = -Infinity;
            let maxBottom = -Infinity;

            allSpans.forEach(span => {
                const rect = span.getBoundingClientRect();
                const relativeLeft = rect.left - pageRect.left;
                const relativeTop = rect.top - pageRect.top;
                const relativeRight = rect.right - pageRect.left;
                const relativeBottom = rect.bottom - pageRect.top;

                minLeft = Math.min(minLeft, relativeLeft);
                minTop = Math.min(minTop, relativeTop);
                maxRight = Math.max(maxRight, relativeRight);
                maxBottom = Math.max(maxBottom, relativeBottom);
            });

            // Ensure minimum dimensions
            const width = Math.max(maxRight - minLeft, 20);
            const height = Math.max(maxBottom - minTop, 15);

            return {
                left: minLeft,
                top: minTop,
                width,
                height,
                pageNumber: pageIndex + 1
            };
        } catch (error) {
            console.error('Error finding text in PDF:', error);
            return null;
        }
    }, []); // Empty deps - function doesn't depend on any props/state

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

        // Wait a bit more for text layer to fully render, with retry logic
        const searchWithRetry = (retryCount = 0) => {
            const maxRetries = 3;
            const foundHighlights = [];

            // Check if page wrappers exist
            const pageWrappers = document.querySelectorAll('.pdf-page-wrapper[data-page-number]');
            if (pageWrappers.length === 0) {
                if (retryCount < maxRetries) {
                    if (retryCount === 0) {
                        // Only log first retry attempt
                        console.log(`⏳ No page wrappers found, retrying...`);
                    }
                    setTimeout(() => searchWithRetry(retryCount + 1), 500);
                    return;
                } else {
                    console.warn('⚠️ No PDF pages found after retries');
                    setHighlights([]);
                    isProcessingRef.current = false;
                    return;
                }
            }

            currentIssues.forEach((issue, issueIndex) => {
                // Use exact_quote if available, fallback to original_text
                let searchText = issue.exact_quote || issue.original_text;
                if (!searchText || !searchText.trim()) {
                    console.warn(`Issue ${issueIndex + 1} has no searchable text`);
                    return;
                }

                // Clean and normalize search text
                searchText = searchText.trim();

                // Try to find text on each page (PDF might have multiple pages)
                let found = false;
                
                for (let pageIndex = 0; pageIndex < pageWrappers.length; pageIndex++) {
                    const position = findTextInPDF(searchText, pageIndex);
                    if (position) {
                        foundHighlights.push({
                            ...position,
                            issueIndex,
                            issue
                        });
                        // Only log on first successful find
                        if (issueIndex === 0 || foundHighlights.length === 0) {
                            console.log(`✅ Found issue ${issueIndex + 1} on page ${position.pageNumber}`);
                        }
                        found = true;
                        break; // Found on this page, don't search other pages
                    }
                }

                // If not found, try multiple fallback strategies
                if (!found) {
                    // Strategy 1: Try with shorter text (first sentence or first 50 chars)
                    if (searchText.length > 30) {
                        const shorterText = searchText.split(/[.!?。！？]/)[0] || searchText.substring(0, 50);
                        if (shorterText.trim().length > 10) {
                            for (let pageIndex = 0; pageIndex < pageWrappers.length; pageIndex++) {
                                const position = findTextInPDF(shorterText.trim(), pageIndex);
                                if (position) {
                                    foundHighlights.push({
                                        ...position,
                                        issueIndex,
                                        issue
                                    });
                                    found = true;
                                    break;
                                }
                            }
                        }
                    }

                    // Strategy 2: Try with first 3-5 words (key phrases)
                    if (!found && searchText.split(' ').length > 3) {
                        const words = searchText.split(' ').filter(w => w.trim().length > 2);
                        if (words.length >= 3) {
                            const keyPhrase = words.slice(0, Math.min(5, words.length)).join(' ');
                            for (let pageIndex = 0; pageIndex < pageWrappers.length; pageIndex++) {
                                const position = findTextInPDF(keyPhrase, pageIndex);
                                if (position) {
                                    foundHighlights.push({
                                        ...position,
                                        issueIndex,
                                        issue
                                    });
                                    found = true;
                                    break;
                                }
                            }
                        }
                    }

                    // Strategy 3: Try with longest word (if it's a technical term)
                    if (!found) {
                        const words = searchText.split(/\s+/).filter(w => w.length > 4);
                        if (words.length > 0) {
                            // Sort by length descending
                            words.sort((a, b) => b.length - a.length);
                            // Try top 3 longest words
                            for (const word of words.slice(0, 3)) {
                                for (let pageIndex = 0; pageIndex < pageWrappers.length; pageIndex++) {
                                    const position = findTextInPDF(word, pageIndex);
                                    if (position) {
                                        foundHighlights.push({
                                            ...position,
                                            issueIndex,
                                            issue
                                        });
                                        found = true;
                                        break;
                                    }
                                }
                                if (found) break;
                            }
                        }
                    }
                }

                // Track if issue was found (will log summary at end)
                if (!found) {
                    // Issue not found - will be logged in summary
                }
            });

            // If no highlights found and we have retries left, try again
            if (foundHighlights.length === 0 && retryCount < maxRetries) {
                if (retryCount === 0) {
                    // Only log first retry
                    console.log(`⏳ No highlights found, retrying...`);
                }
                setTimeout(() => searchWithRetry(retryCount + 1), 500);
                return;
            }

            setHighlights(foundHighlights);
            isProcessingRef.current = false;
            
            // Log final result
            const totalIssues = currentIssues.length;
            const foundCount = foundHighlights.length;
            const notFoundCount = totalIssues - foundCount;
            
            if (foundCount > 0) {
                console.log(`✅ PDF text search: Found ${foundCount}/${totalIssues} highlights`);
            }
            if (notFoundCount > 0) {
                console.warn(`⚠️ Could not find ${notFoundCount} issue(s) in PDF. Check if exact_quote matches PDF text.`);
            }
        };

        // Start search with initial delay
        const timeoutId = setTimeout(() => {
            searchWithRetry(0);
        }, 500); // Wait 500ms for text layer to be fully ready

        return () => {
            clearTimeout(timeoutId);
            isProcessingRef.current = false;
        };
    }, [issuesKey, textLayerReady]); // Removed findTextInPDF from deps - it's stable

    return highlights;
};

export default usePDFTextSearch;

