/**
 * Example usage of CVHighlighter component
 * 
 * This file demonstrates how to use the CVHighlighter component
 * with sample data matching the requirements.
 */

import React from 'react';
import CVHighlighter from './CVHighlighter';

const CVHighlighterExample = () => {
    // Sample CV text (from requirements)
    const cvText = `
Kinh nghiệm làm việc:
- Phát triển hệ thống Backend sử dụng Node.js va Express.
- Tối ưu hóa query database giúp giảm 50% thời gian phản hồi.
`;

    // Sample issues (from requirements)
    const issues = [
        {
            severity: "high",
            exact_quote: "Phát triển hệ thống Backend sử dụng Node.js và Express", // Note: AI added 'à' to 'va'
            suggestion: "Cần ghi rõ phiên bản Node.js và quy mô hệ thống.",
            section: "experience"
        },
        {
            severity: "medium",
            exact_quote: "giảm 50% thời gian",
            suggestion: "Nên đưa ra con số cụ thể về giây (ms).",
            section: "experience"
        }
    ];

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2>CV Highlighter Example</h2>
            <p>This example demonstrates fuzzy matching with issues that don't match exactly:</p>
            <ul>
                <li>Issue 1: "va" in CV vs "và" in exact_quote (fuzzy match should find it)</li>
                <li>Issue 2: Exact match should work</li>
            </ul>
            
            <div style={{ marginTop: '2rem', border: '1px solid #ddd', borderRadius: '8px', padding: '1rem' }}>
                <CVHighlighter cvText={cvText} issues={issues} />
            </div>
        </div>
    );
};

export default CVHighlighterExample;

