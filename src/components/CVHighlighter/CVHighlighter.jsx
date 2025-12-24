import React, { useMemo } from 'react';
import { normalizeText, findFuzzyLocation } from '../../utils/stringUtils';
import { getIssueColor, hexToRgba } from '../../utils/colorUtils';
import './CVHighlighter.scss';

/**
 * Component to display CV text with highlighted issues
 * 
 * @param {Object} props
 * @param {string} props.cvText - The CV text to display
 * @param {Array} props.issues - Array of issues with exact_quote, suggestion, severity, section
 */
const CVHighlighter = ({ cvText, issues = [] }) => {
    // Process issues and find their positions in cvText
    const segments = useMemo(() => {
        if (!cvText || !issues || issues.length === 0) {
            return [{ text: cvText || '', isIssue: false, issues: null }];
        }

        // Find positions for each issue with precise matching
        const issuePositions = [];
        
        issues.forEach((issue, issueIndex) => {
            const quote = issue.exact_quote || issue.original_text;
            if (!quote || typeof quote !== 'string' || quote.trim().length === 0) {
                return; // Skip issues without quote
            }

            // Try to find the exact quote in CV text
            let position = findFuzzyLocation(cvText, quote);
            
            if (position) {
                // Validate and refine position to ensure accuracy
                // Ensure position is within bounds
                position.start = Math.max(0, Math.min(position.start, cvText.length));
                position.end = Math.max(position.start, Math.min(position.end, cvText.length));
                
                // Get the actual text at this position
                const foundText = cvText.substring(position.start, position.end);
                
                // Try to refine position by finding exact match boundaries
                // This helps when fuzzy matching returns a slightly larger range
                const trimmedQuote = quote.trim();
                const normalizedFound = normalizeText(foundText);
                const normalizedQuote = normalizeText(trimmedQuote);
                
                // If found text is longer than quote, try to find exact boundaries
                if (normalizedFound.length > normalizedQuote.length) {
                    // Try to find the quote within the found text
                    const quoteIndex = normalizedFound.indexOf(normalizedQuote);
                    if (quoteIndex !== -1) {
                        // Adjust position to match exact quote boundaries
                        // This is approximate but helps reduce over-highlighting
                        const ratio = normalizedQuote.length / normalizedFound.length;
                        const adjustment = Math.floor((position.end - position.start) * (1 - ratio) / 2);
                        position.start = Math.max(0, position.start + adjustment);
                        position.end = Math.min(cvText.length, position.end - adjustment);
                    }
                }
                
                // Final validation: ensure we have valid range
                if (position.start < position.end && position.end <= cvText.length) {
                    issuePositions.push({
                        start: position.start,
                        end: position.end,
                        issue: {
                            ...issue,
                            index: issueIndex
                        }
                    });
                } else {
                    console.warn(`⚠️ Invalid position for issue ${issueIndex + 1}: start=${position.start}, end=${position.end}`);
                }
            } else {
                console.warn(`⚠️ Could not find issue ${issueIndex + 1} in CV text: "${quote.substring(0, 50)}..."`);
            }
        });

        // Sort by start position, then by end position
        issuePositions.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            return a.end - b.end;
        });

        // Build segments: Each issue gets its own exact range, NO merging
        // This ensures we only highlight the exact text from exact_quote
        const segments = [];
        
        if (issuePositions.length === 0) {
            return [{ text: cvText, isIssue: false, issues: null }];
        }

        // Create breakpoints from all issue positions (start and end)
        const breakpoints = new Set([0, cvText.length]);
        issuePositions.forEach(pos => {
            // Ensure breakpoints are within bounds
            const validStart = Math.max(0, Math.min(pos.start, cvText.length));
            const validEnd = Math.max(validStart, Math.min(pos.end, cvText.length));
            breakpoints.add(validStart);
            breakpoints.add(validEnd);
        });
        
        const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b);

        // Build segments between breakpoints
        // Each segment is either highlighted (if within an issue range) or regular text
        for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
            const segmentStart = sortedBreakpoints[i];
            const segmentEnd = sortedBreakpoints[i + 1];
            
            // Find all issues that contain this segment
            // A segment is contained if: segmentStart >= issue.start && segmentEnd <= issue.end
            const containingIssues = issuePositions.filter(pos => {
                const validStart = Math.max(0, Math.min(pos.start, cvText.length));
                const validEnd = Math.max(validStart, Math.min(pos.end, cvText.length));
                return segmentStart >= validStart && segmentEnd <= validEnd;
            });
            
            const segmentText = cvText.substring(segmentStart, segmentEnd);
            if (segmentText.length === 0) continue;
            
            if (containingIssues.length > 0) {
                // This segment is within one or more issue ranges - highlight it
                segments.push({
                    text: segmentText,
                    isIssue: true,
                    issues: containingIssues
                });
            } else {
                // Regular text segment
                segments.push({
                    text: segmentText,
                    isIssue: false,
                    issues: null
                });
            }
        }

        return segments;
    }, [cvText, issues]);

    // Get style based on issue index (not severity)
    const getIssueStyle = (issueIndex) => {
        const color = getIssueColor(issueIndex);
        return {
            backgroundColor: hexToRgba(color, 0.2), // 20% opacity for background
            borderBottom: `3px solid ${color}`, // Solid border with full opacity
            color: '#1f2937', // Dark text color for readability
        };
    };

    // Get section label in Vietnamese
    const getSectionLabel = (section) => {
        const sectionMap = {
            'summary': 'Tóm tắt',
            'experience': 'Kinh nghiệm',
            'skills': 'Kỹ năng',
            'education': 'Học vấn',
            'format': 'Định dạng',
            'job_matching': 'Phù hợp JD',
            'projects': 'Dự án',
            'certifications': 'Chứng chỉ',
            'languages': 'Ngôn ngữ',
            'achievements': 'Thành tích'
        };
        return sectionMap[section] || section;
    };

    if (!cvText) {
        return (
            <div className="cv-highlighter-empty">
                <p>CV text không có</p>
            </div>
        );
    }

    return (
        <div className="cv-highlighter">
            {segments.map((segment, segmentIndex) => {
                if (segment.isIssue && segment.issues && segment.issues.length > 0) {
                    // Use primary issue's index for color (first issue in overlapping set)
                    const primaryIssue = segment.issues[0];
                    const issueIndex = primaryIssue.issue.index;
                    const style = getIssueStyle(issueIndex);
                    
                    // Build tooltip with all suggestions
                    const tooltip = segment.issues.map((pos, idx) => {
                        const section = getSectionLabel(pos.issue.section);
                        const severityLabel = pos.issue.severity ? ` [${pos.issue.severity}]` : '';
                        return `Vấn đề ${pos.issue.index + 1} - ${section}${severityLabel}: ${pos.issue.suggestion}`;
                    }).join('\n\n');

                    return (
                        <span
                            key={`issue-${segmentIndex}`}
                            className="cv-highlight"
                            style={style}
                            title={tooltip}
                            data-issue-index={issueIndex}
                        >
                            {segment.text}
                        </span>
                    );
                } else {
                    // Regular text - preserve line breaks
                    const lines = segment.text.split('\n');
                    return (
                        <React.Fragment key={`text-${segmentIndex}`}>
                            {lines.map((line, lineIdx) => (
                                <React.Fragment key={`line-${segmentIndex}-${lineIdx}`}>
                                    {line}
                                    {lineIdx < lines.length - 1 && <br />}
                                </React.Fragment>
                            ))}
                        </React.Fragment>
                    );
                }
            })}
        </div>
    );
};

export default CVHighlighter;

