import React, { useMemo } from 'react';
import { normalizeText, findFuzzyLocation } from '../../utils/stringUtils';
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

        // Find positions for each issue
        const issuePositions = [];
        
        issues.forEach((issue, issueIndex) => {
            const quote = issue.exact_quote || issue.original_text;
            if (!quote || typeof quote !== 'string' || quote.trim().length === 0) {
                return; // Skip issues without quote
            }

            const position = findFuzzyLocation(cvText, quote);
            if (position) {
                issuePositions.push({
                    start: position.start,
                    end: position.end,
                    issue: {
                        ...issue,
                        index: issueIndex
                    }
                });
            } else {
                console.warn(`⚠️ Could not find issue ${issueIndex + 1} in CV text: "${quote.substring(0, 50)}..."`);
            }
        });

        // Sort by start position
        issuePositions.sort((a, b) => a.start - b.start);

        // Build segments: handle overlapping issues
        // Strategy: Create a map of character positions to issues
        const charToIssues = new Map();
        
        issuePositions.forEach(pos => {
            for (let i = pos.start; i < pos.end; i++) {
                if (!charToIssues.has(i)) {
                    charToIssues.set(i, []);
                }
                charToIssues.get(i).push(pos);
            }
        });

        // Group consecutive characters with same issue set
        const segments = [];
        let currentStart = 0;
        let currentIssues = [];

        for (let i = 0; i <= cvText.length; i++) {
            const issuesAtPos = charToIssues.get(i) || [];
            const issueIds = issuesAtPos.map(p => `${p.issue.index}-${p.start}-${p.end}`).sort();
            const currentIssueIds = currentIssues.map(p => `${p.issue.index}-${p.start}-${p.end}`).sort();
            
            // If issue set changed, create a segment
            if (i === cvText.length || JSON.stringify(issueIds) !== JSON.stringify(currentIssueIds)) {
                if (i > currentStart) {
                    segments.push({
                        text: cvText.substring(currentStart, i),
                        isIssue: currentIssues.length > 0,
                        issues: currentIssues.length > 0 ? [...currentIssues] : null
                    });
                }
                currentStart = i;
                currentIssues = issuesAtPos;
            }
        }

        return segments;
    }, [cvText, issues]);

    // Get color based on severity
    const getSeverityStyle = (severity) => {
        switch (severity) {
            case 'high':
                return {
                    backgroundColor: 'rgba(254, 226, 226, 0.8)', // red-100 with opacity
                    borderBottomColor: '#ef4444', // red-500
                    color: '#991b1b' // red-800
                };
            case 'medium':
                return {
                    backgroundColor: 'rgba(254, 249, 195, 0.8)', // yellow-100 with opacity
                    borderBottomColor: '#eab308', // yellow-500
                    color: '#854d0e' // yellow-800
                };
            case 'low':
                return {
                    backgroundColor: 'rgba(219, 234, 254, 0.8)', // blue-100 with opacity
                    borderBottomColor: '#3b82f6', // blue-500
                    color: '#1e3a8a' // blue-800
                };
            default:
                return {
                    backgroundColor: 'rgba(243, 244, 246, 0.8)', // gray-100 with opacity
                    borderBottomColor: '#6b7280', // gray-500
                    color: '#1f2937' // gray-800
                };
        }
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
                    // Handle multiple overlapping issues
                    const primaryIssue = segment.issues[0];
                    const severity = primaryIssue.issue.severity || 'low';
                    const style = getSeverityStyle(severity);
                    
                    // Build tooltip with all suggestions
                    const tooltip = segment.issues.map(pos => {
                        const section = getSectionLabel(pos.issue.section);
                        return `${section}: ${pos.issue.suggestion}`;
                    }).join('\n');

                    // If multiple issues overlap, use primary issue's severity
                    // but indicate multiple issues in tooltip
                    return (
                        <span
                            key={`issue-${segmentIndex}`}
                            className="cv-highlight"
                            style={style}
                            title={tooltip}
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

