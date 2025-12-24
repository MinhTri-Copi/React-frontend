import React, { useEffect, useRef } from 'react';
import './PDFHighlight.scss';

/**
 * Component to render highlight boxes on PDF
 * @param {Array} highlights - Array of highlight positions from usePDFTextSearch
 * @param {number} activeIssueIndex - Index of currently active issue
 * @param {Function} onHighlightClick - Callback when highlight is clicked
 */
const PDFHighlight = ({ highlights = [], activeIssueIndex = null, onHighlightClick }) => {
    // Get color based on issue index (to match the issue card colors)
    const getIssueColor = (index) => {
        // Array of distinct colors (matching CVReview.js getIssueColor)
        const colors = [
            '#ff4444', // Red
            '#ffaa00', // Orange
            '#44aaff', // Blue
            '#ff6b9d', // Pink
            '#9b59b6', // Purple
            '#1abc9c', // Turquoise
            '#e74c3c', // Dark Red
            '#f39c12', // Dark Orange
            '#3498db', // Dark Blue
            '#e67e22', // Carrot
            '#16a085', // Green
            '#c0392b', // Dark Red 2
            '#d35400', // Orange 2
            '#2980b9', // Blue 2
            '#8e44ad', // Purple 2
        ];
        return colors[index % colors.length];
    };

    // Get color based on severity (fallback)
    const getColorBySeverity = (severity) => {
        switch (severity) {
            case 'high':
                return '#e74c3c'; // Red
            case 'medium':
                return '#f39c12'; // Orange
            case 'low':
                return '#f1c40f'; // Yellow
            default:
                return '#3498db'; // Blue (default)
        }
    };

    // Render highlights using DOM manipulation (necessary because we need to inject into page wrappers)
    const previousHighlightsCountRef = useRef(0);
    
    useEffect(() => {
        const currentHighlightsCount = highlights?.length || 0;
        
        // Only log if highlights count changed
        if (currentHighlightsCount !== previousHighlightsCountRef.current) {
            if (currentHighlightsCount > 0) {
                console.log(`🎨 PDFHighlight: Rendering ${currentHighlightsCount} highlights`);
            }
            previousHighlightsCountRef.current = currentHighlightsCount;
        }
        
        // Clear existing highlights
        document.querySelectorAll('.pdf-highlight-overlay').forEach(el => el.remove());

        if (!highlights || highlights.length === 0) {
            return;
        }

        // Group highlights by page
        const highlightsByPage = {};
        highlights.forEach(highlight => {
            const pageNum = highlight.pageNumber;
            if (!highlightsByPage[pageNum]) {
                highlightsByPage[pageNum] = [];
            }
            highlightsByPage[pageNum].push(highlight);
        });

        // Render highlights for each page
        Object.keys(highlightsByPage).forEach(pageNum => {
            const pageHighlights = highlightsByPage[pageNum];
            // Use data attribute selector for more reliable page finding
            const pageWrapper = document.querySelector(`.pdf-page-wrapper[data-page-number="${pageNum}"]`);
            
            if (!pageWrapper) {
                console.warn(`⚠️ PDFHighlight: Page wrapper not found for page ${pageNum}`);
                return;
            }

            // Check if page wrapper has dimensions (PDF must be rendered)
            const pageRect = pageWrapper.getBoundingClientRect();
            if (pageRect.width === 0 || pageRect.height === 0) {
                console.warn(`⚠️ PDFHighlight: Page ${pageNum} wrapper has no dimensions, skipping highlights`);
                return;
            }

            // Check if page wrapper has position relative (required for absolute positioning)
            const computedStyle = window.getComputedStyle(pageWrapper);
            if (computedStyle.position === 'static') {
                pageWrapper.style.position = 'relative';
            }

            // Remove existing overlay for this page if any
            const existingOverlay = pageWrapper.querySelector('.pdf-highlight-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }

            // Create overlay div
            const overlay = document.createElement('div');
            overlay.className = 'pdf-highlight-overlay';
            // Ensure overlay is positioned correctly
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10;
            `;

            pageHighlights.forEach((highlight, idx) => {
                const isActive = highlight.issueIndex === activeIssueIndex;
                // Use severity-based color, fallback to index-based color
                const severity = highlight.issue?.severity;
                const color = severity ? getColorBySeverity(severity) : getIssueColor(highlight.issueIndex);

                const highlightDiv = document.createElement('div');
                highlightDiv.className = `pdf-highlight ${isActive ? 'active' : ''}`;
                highlightDiv.setAttribute('data-issue-index', highlight.issueIndex);
                
                // Convert hex color to rgba for background
                const hexToRgba = (hex, alpha) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                };

                // Ensure valid dimensions
                const width = Math.max(highlight.width || 20, 20);
                const height = Math.max(highlight.height || 15, 15);
                const left = Math.max(highlight.left || 0, 0);
                const top = Math.max(highlight.top || 0, 0);

                highlightDiv.style.cssText = `
                    position: absolute;
                    left: ${left}px;
                    top: ${top}px;
                    width: ${width}px;
                    height: ${height}px;
                    border: 3px solid ${color};
                    background-color: ${hexToRgba(color, 0.2)};
                    border-radius: 3px;
                    pointer-events: auto;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: ${isActive ? `0 0 12px ${hexToRgba(color, 0.5)}` : `0 2px 4px ${hexToRgba(color, 0.3)}`};
                    z-index: ${isActive ? 11 : 10};
                `;
                highlightDiv.title = `Vấn đề ${highlight.issueIndex + 1}: ${highlight.issue.suggestion || highlight.issue.original_text || 'Vấn đề'}`;
                highlightDiv.onclick = (e) => {
                    e.stopPropagation();
                    if (onHighlightClick) {
                        onHighlightClick(highlight.issueIndex);
                    }
                };

                // Add number badge
                const numberBadge = document.createElement('span');
                numberBadge.className = 'pdf-highlight-number';
                numberBadge.textContent = highlight.issueIndex + 1;
                numberBadge.style.cssText = `
                    position: absolute;
                    top: -8px;
                    left: -8px;
                    background-color: ${color};
                    color: #fff;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    pointer-events: none;
                    z-index: 12;
                `;

                highlightDiv.appendChild(numberBadge);
                overlay.appendChild(highlightDiv);
            });

            // Only append if overlay has highlights
            if (overlay.children.length > 0) {
                pageWrapper.appendChild(overlay);
                console.log(`✅ Added ${overlay.children.length} highlights to page ${pageNum}`);
            }
        });

        // Cleanup function
        return () => {
            document.querySelectorAll('.pdf-highlight-overlay').forEach(el => el.remove());
        };
    }, [highlights, activeIssueIndex, onHighlightClick]);

    return null; // This component doesn't render anything directly - it uses DOM manipulation
};

export default PDFHighlight;

