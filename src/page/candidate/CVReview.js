import React, { useState, useEffect, useRef } from 'react';
import CandidateNav from '../../components/Navigation/CandidateNav';
import Footer from '../../components/Footer/Footer';
import { toast } from 'react-toastify';
import { uploadCV, getCVStatus, getRecordById } from '../../service.js/recordService';
import { reviewCV } from '../../service.js/cvReviewService';
import './CVReview.scss';

const CVReview = () => {
    const [user, setUser] = useState(null);
    const [cvFile, setCvFile] = useState(null);
    const [cvFilePreview, setCvFilePreview] = useState(null);
    const [jdFileNames, setJdFileNames] = useState([null]); // Tên file JD để hiển thị (chỉ .txt)
    const [jdTexts, setJdTexts] = useState(['']); // JD texts (from file or manual input)
    const [jdErrors, setJdErrors] = useState([null]); // Lỗi validation cho mỗi JD
    const [isUploadingCV, setIsUploadingCV] = useState(false);
    const [isExtractingJD, setIsExtractingJD] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewResult, setReviewResult] = useState(null);
    const [cvText, setCvText] = useState('');
    const [recordId, setRecordId] = useState(null);
    const cvFileInputRef = useRef(null);
    const jdFileInputRefs = useRef([]);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
        }
    }, []);

    // Không cần useEffect extractJDTexts nữa vì đọc trực tiếp khi chọn file

    const handleCVFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Chỉ chấp nhận file PDF, DOC, DOCX!');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File không được vượt quá 5MB!');
            return;
        }

        setCvFile(file);
        setCvFilePreview(URL.createObjectURL(file));
        setReviewResult(null);
        setCvText('');
        setRecordId(null);

        // Upload CV
        await uploadCVFile(file);
    };

    const uploadCVFile = async (file) => {
        if (!user) {
            toast.error('Vui lòng đăng nhập!');
            return;
        }

        setIsUploadingCV(true);
        try {
            const res = await uploadCV(file, user.id);
            if (res && res.data && res.data.EC === 0) {
                toast.success('Upload CV thành công! Đang xử lý...');
                setRecordId(res.data.DT.recordId);
                
                // Poll for extraction status
                pollCVExtractionStatus(res.data.DT.recordId);
            } else {
                toast.error(res.data.EM || 'Upload CV thất bại!');
            }
        } catch (error) {
            console.error('Error uploading CV:', error);
            toast.error('Có lỗi khi upload CV!');
        } finally {
            setIsUploadingCV(false);
        }
    };

    const pollCVExtractionStatus = async (recordId) => {
        const maxAttempts = 30; // 30 attempts = 90 seconds
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;
            try {
                const res = await getCVStatus();
                if (res && res.data && res.data.EC === 0) {
                    const status = res.data.DT;
                    if (status.status === 'READY') {
                        // Get CV text from record
                        const recordRes = await getRecordById(recordId, user.id);
                        if (recordRes && recordRes.data && recordRes.data.EC === 0 && recordRes.data.DT.cvText) {
                            setCvText(recordRes.data.DT.cvText);
                            clearInterval(interval);
                            toast.success('CV đã được xử lý thành công!');
                        }
                    } else if (status.status === 'FAILED') {
                        clearInterval(interval);
                        toast.error('Xử lý CV thất bại!');
                    } else if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        toast.warning('Xử lý CV đang mất nhiều thời gian. Vui lòng thử lại sau.');
                    }
                }
            } catch (error) {
                console.error('Error checking CV status:', error);
            }
        }, 3000); // Check every 3 seconds
    };

    const handleJDFileChange = (index, event) => {
        const file = event.target.files[0];
        if (!file) {
            // Reset error nếu không có file
            const newErrors = [...jdErrors];
            newErrors[index] = null;
            setJdErrors(newErrors);
            return;
        }

        // Validate file extension - chỉ chấp nhận .txt
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.txt')) {
            const errorMsg = 'Chỉ chấp nhận file .txt! Vui lòng chọn file đúng định dạng.';
            toast.error(errorMsg);
            
            // Cập nhật lỗi UI
            const newErrors = [...jdErrors];
            newErrors[index] = errorMsg;
            setJdErrors(newErrors);
            
            // Reset input
            if (jdFileInputRefs.current[index]) {
                jdFileInputRefs.current[index].value = '';
            }
            return;
        }

        // Validate file type (kiểm tra thêm MIME type)
        if (file.type && file.type !== 'text/plain' && file.type !== '') {
            const errorMsg = 'File không đúng định dạng .txt!';
            toast.error(errorMsg);
            
            const newErrors = [...jdErrors];
            newErrors[index] = errorMsg;
            setJdErrors(newErrors);
            
            if (jdFileInputRefs.current[index]) {
                jdFileInputRefs.current[index].value = '';
            }
            return;
        }

        // Clear error nếu file hợp lệ
        const newErrors = [...jdErrors];
        newErrors[index] = null;
        setJdErrors(newErrors);

        // Sử dụng FileReader để đọc nội dung file .txt
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                
                // Cập nhật tên file và nội dung text
                const newFileNames = [...jdFileNames];
                newFileNames[index] = file.name;
                setJdFileNames(newFileNames);
                
                const newJdTexts = [...jdTexts];
                newJdTexts[index] = text;
                setJdTexts(newJdTexts);
                
                toast.success(`Đã đọc file JD ${index + 1}: ${file.name}`);
            } catch (error) {
                console.error('Error reading file:', error);
                toast.error('Có lỗi khi đọc file!');
                
                const newErrors = [...jdErrors];
                newErrors[index] = 'Có lỗi khi đọc file!';
                setJdErrors(newErrors);
            }
        };
        
        reader.onerror = () => {
            toast.error('Có lỗi khi đọc file!');
            
            const newErrors = [...jdErrors];
            newErrors[index] = 'Có lỗi khi đọc file!';
            setJdErrors(newErrors);
            
            if (jdFileInputRefs.current[index]) {
                jdFileInputRefs.current[index].value = '';
            }
        };
        
        // Đọc file dưới dạng text
        reader.readAsText(file, 'UTF-8');
    };

    const handleAddJD = () => {
        if (jdFileNames.length < 5) {
            setJdFileNames([...jdFileNames, null]);
            setJdTexts([...jdTexts, '']);
            setJdErrors([...jdErrors, null]);
            jdFileInputRefs.current.push(React.createRef());
        } else {
            toast.warning('Tối đa 5 JD được phép!');
        }
    };

    const handleRemoveJD = (index) => {
        if (jdFileNames.length > 1) {
            const newJdFileNames = jdFileNames.filter((_, i) => i !== index);
            const newJdTexts = jdTexts.filter((_, i) => i !== index);
            const newJdErrors = jdErrors.filter((_, i) => i !== index);
            setJdFileNames(newJdFileNames);
            setJdTexts(newJdTexts);
            setJdErrors(newJdErrors);
        }
    };

    // Không cần hàm extractJDTexts nữa vì đã đọc trực tiếp trong handleJDFileChange

    const handleReview = async () => {
        // Validate
        if (!cvFile || !cvText || cvText.trim().length === 0) {
            toast.error('Vui lòng upload CV và đợi xử lý xong!');
            return;
        }

        const validJdTexts = jdTexts.filter(jd => jd && jd.trim().length > 0);
        if (validJdTexts.length === 0) {
            toast.error('Vui lòng upload ít nhất 1 JD!');
            return;
        }

        if (!recordId) {
            toast.error('CV chưa được xử lý xong. Vui lòng đợi!');
            return;
        }

        setIsReviewing(true);
        setReviewResult(null);

        try {
            const res = await reviewCV(recordId, validJdTexts);
            
            if (res && res.EC === 0) {
                setReviewResult(res.DT);
                toast.success('Phân tích CV thành công!');
            } else {
                toast.error(res.EM || 'Có lỗi khi phân tích CV!');
            }
        } catch (error) {
            console.error('Error reviewing CV:', error);
            toast.error(error.response?.data?.EM || error.message || 'Có lỗi khi phân tích CV!');
        } finally {
            setIsReviewing(false);
        }
    };

    // Render CV as HTML/CSS (like PDF) with highlighted issues
    const renderCVWithBoxes = (text, issues) => {
        if (!text) {
            return <div className="cv-document">CV text không có</div>;
        }

        // Normalize text for matching (remove punctuation, extra spaces)
        const normalizeText = (str) => {
            return str
                .replace(/[.,;:!?\-_()\[\]{}"'`]/g, ' ') // Remove punctuation
                .replace(/\s+/g, ' ') // Multiple spaces to single
                .trim()
                .toLowerCase();
        };

        // Find text position in original text (fuzzy matching)
        const findTextPosition = (searchText, fullText) => {
            if (!searchText || !fullText) return null;
            
            const normalizedSearch = normalizeText(searchText);
            const normalizedFull = normalizeText(fullText);
            
            // Try exact match first
            let foundIndex = normalizedFull.indexOf(normalizedSearch);
            if (foundIndex !== -1) {
                // Map back to original position
                return mapNormalizedToOriginal(foundIndex, normalizedSearch.length, fullText, normalizedFull);
            }
            
            // Try partial match (at least 60% of words match)
            const searchWords = normalizedSearch.split(' ').filter(w => w.length > 2);
            if (searchWords.length === 0) return null;
            
            // Find position where most words match
            let bestMatch = null;
            let bestScore = 0;
            const minMatchLength = Math.max(10, normalizedSearch.length * 0.5); // At least 50% of search length
            
            for (let i = 0; i <= normalizedFull.length - minMatchLength; i++) {
                // Try different substring lengths
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
                        bestMatch = mapNormalizedToOriginal(i, len, fullText, normalizedFull);
                        break; // Found good match, stop searching this position
                    }
                }
            }
            
            return bestMatch;
        };

        // Map normalized position back to original text
        const mapNormalizedToOriginal = (normalizedStart, normalizedLength, originalText, normalizedText) => {
            // Build character map: original index -> normalized index
            let originalIndex = 0;
            let normalizedIndex = 0;
            const charMap = [];
            
            for (let i = 0; i < originalText.length; i++) {
                const char = originalText[i].toLowerCase();
                if (/[a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(char)) {
                    charMap.push({ original: i, normalized: normalizedIndex });
                    normalizedIndex++;
                } else {
                    charMap.push({ original: i, normalized: -1 }); // Skip in normalized
                }
            }
            
            // Find start position
            let start = 0;
            for (let i = 0; i < charMap.length; i++) {
                if (charMap[i].normalized === normalizedStart) {
                    start = charMap[i].original;
                    break;
                } else if (charMap[i].normalized > normalizedStart) {
                    start = i > 0 ? charMap[i - 1].original : 0;
                    break;
                }
            }
            
            // Find end position
            let end = originalText.length;
            const normalizedEnd = normalizedStart + normalizedLength;
            for (let i = 0; i < charMap.length; i++) {
                if (charMap[i].normalized >= normalizedEnd) {
                    end = charMap[i].original;
                    break;
                }
            }
            
            return { start, end };
        };

        // Create issue map
        const issueMap = new Map();
        issues.forEach((issue, index) => {
            if (issue.original_text && issue.original_text.trim()) {
                const originalText = issue.original_text.trim();
                issueMap.set(index, {
                    ...issue,
                    index,
                    originalText: originalText
                });
            }
        });

        // Find issue positions in text
        const issuePositions = [];
        
        issueMap.forEach((issueInfo) => {
            const position = findTextPosition(issueInfo.originalText, text);
            if (position) {
                issuePositions.push({
                    start: position.start,
                    end: position.end,
                    issue: issueInfo
                });
                console.log(`✅ Found issue ${issueInfo.index + 1} (${getSectionLabel(issueInfo.section)}): "${issueInfo.originalText.substring(0, 50)}..." at position ${position.start}-${position.end}`);
            } else {
                console.warn(`⚠️ Could not find issue ${issueInfo.index + 1} (${getSectionLabel(issueInfo.section)}): "${issueInfo.originalText.substring(0, 50)}..." in CV`);
                
                // Fallback 1: Try to find key words (longer words first)
                const words = issueInfo.originalText.split(/\s+/).filter(w => w.length > 3);
                words.sort((a, b) => b.length - a.length); // Sort by length descending
                
                let found = false;
                for (const word of words.slice(0, 5)) { // Try top 5 longest words
                    const wordLower = word.toLowerCase().replace(/[.,;:!?\-_()\[\]{}"'`]/g, '');
                    const textLower = text.toLowerCase();
                    const wordPos = textLower.indexOf(wordLower);
                    
                    if (wordPos !== -1) {
                        // Find the full word in original text (case-insensitive)
                        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                        const match = text.substring(Math.max(0, wordPos - 50), Math.min(text.length, wordPos + word.length + 50)).match(regex);
                        
                        if (match) {
                            const actualPos = textLower.indexOf(wordLower, Math.max(0, wordPos - 50));
                            issuePositions.push({
                                start: actualPos,
                                end: Math.min(text.length, actualPos + word.length),
                                issue: issueInfo
                            });
                            console.log(`⚠️ Found keyword match for issue ${issueInfo.index + 1} using "${word}" at position ${actualPos}`);
                            found = true;
                            break;
                        }
                    }
                }
                
                // Fallback 2: If still not found, highlight the entire line containing any keyword
                if (!found && words.length > 0) {
                    const lines = text.split('\n');
                    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
                        const line = lines[lineIdx];
                        const lineLower = line.toLowerCase();
                        
                        // Check if line contains any keyword
                        for (const word of words.slice(0, 3)) {
                            const wordLower = word.toLowerCase().replace(/[.,;:!?\-_()\[\]{}"'`]/g, '');
                            if (lineLower.includes(wordLower)) {
                                // Calculate line position in full text
                                let lineStart = 0;
                                for (let i = 0; i < lineIdx; i++) {
                                    lineStart += lines[i].length + 1; // +1 for newline
                                }
                                
                                issuePositions.push({
                                    start: lineStart,
                                    end: lineStart + line.length,
                                    issue: issueInfo
                                });
                                console.log(`⚠️ Found line match for issue ${issueInfo.index + 1} at line ${lineIdx + 1} containing "${word}"`);
                                found = true;
                                break;
                            }
                        }
                        if (found) break;
                    }
                }
            }
        });

        // Sort by start position
        issuePositions.sort((a, b) => a.start - b.start);
        
        // Build parts with highlights - allow overlapping issues
        // Strategy: Create segments for each character position, track which issues apply
        const allPositions = issuePositions.map(pos => ({
            ...pos,
            id: `issue-${pos.issue.index}`
        }));
        
        // Create a map of character positions to issues
        const charToIssues = new Map();
        allPositions.forEach(pos => {
            for (let i = pos.start; i < pos.end; i++) {
                if (!charToIssues.has(i)) {
                    charToIssues.set(i, []);
                }
                charToIssues.get(i).push(pos);
            }
        });
        
        // Build parts: group consecutive characters with same issue set
        const parts = [];
        let currentStart = 0;
        let currentIssues = [];
        
        for (let i = 0; i <= text.length; i++) {
            const issuesAtPos = charToIssues.get(i) || [];
            const issueIds = issuesAtPos.map(p => p.id).sort();
            const currentIssueIds = currentIssues.map(p => p.id).sort();
            
            // If issue set changed, create a part
            if (i === text.length || JSON.stringify(issueIds) !== JSON.stringify(currentIssueIds)) {
                if (i > currentStart) {
                    parts.push({
                        text: text.substring(currentStart, i),
                        isIssue: currentIssues.length > 0,
                        issues: currentIssues.length > 0 ? [...currentIssues] : null
                    });
                }
                currentStart = i;
                currentIssues = issuesAtPos;
            }
        }

        // Render as HTML document (like PDF)
        return (
            <div className="cv-document">
                {parts.map((part, partIndex) => {
                    if (part.isIssue && part.issues && part.issues.length > 0) {
                        // Multiple issues can overlap - use layered highlights
                        const lines = part.text.split('\n');
                        return lines.map((line, lineIdx) => {
                            // If multiple issues, stack them with different border colors
                            if (part.issues.length === 1) {
                                // Single issue - simple highlight
                                const issue = part.issues[0];
                                const issueColor = getIssueColor(issue.issue.index);
                                return (
                                    <span
                                        key={`issue-${partIndex}-${lineIdx}`}
                                        className="cv-highlight"
                                        data-issue-id={`issue-${issue.issue.index}`}
                                        data-section={issue.issue.section}
                                        style={{
                                            backgroundColor: `${issueColor}20`,
                                            borderLeft: `4px solid ${issueColor}`,
                                            borderRight: `4px solid ${issueColor}`,
                                            paddingLeft: '6px',
                                            paddingRight: '6px',
                                        }}
                                        title={`${getSectionLabel(issue.issue.section)}: ${issue.issue.suggestion}`}
                                    >
                                        {line}
                                        {lineIdx < lines.length - 1 && <br />}
                                    </span>
                                );
                            } else {
                                // Multiple overlapping issues - use multiple borders
                                const issueColors = part.issues.map(p => getIssueColor(p.issue.index));
                                const title = part.issues.map(p => 
                                    `${getSectionLabel(p.issue.section)}: ${p.issue.suggestion}`
                                ).join(' | ');
                                
                                // Use multiple border colors (left border for each issue)
                                const borderStyle = issueColors.map((color, idx) => 
                                    `${4 + idx * 2}px solid ${color}`
                                ).join(', ');
                                
                                return (
                                    <span
                                        key={`issue-${partIndex}-${lineIdx}`}
                                        className="cv-highlight cv-highlight-overlap"
                                        style={{
                                            backgroundColor: `${issueColors[0]}20`,
                                            borderLeft: `4px solid ${issueColors[0]}`,
                                            borderRight: `4px solid ${issueColors[issueColors.length - 1]}`,
                                            paddingLeft: '6px',
                                            paddingRight: '6px',
                                            position: 'relative',
                                        }}
                                        title={title}
                                    >
                                        {/* Additional border layers for overlapping issues */}
                                        {issueColors.slice(1).map((color, idx) => (
                                            <span
                                                key={`overlap-${idx}`}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${-4 - (idx + 1) * 2}px`,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: '2px',
                                                    backgroundColor: color,
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        ))}
                                        {line}
                                        {lineIdx < lines.length - 1 && <br />}
                                    </span>
                                );
                            }
                        });
                    } else {
                        // Regular text - preserve line breaks
                        const lines = part.text.split('\n');
                        return lines.map((line, lineIdx) => (
                            <React.Fragment key={`text-${partIndex}-${lineIdx}`}>
                                {line}
                                {lineIdx < lines.length - 1 && <br />}
                            </React.Fragment>
                        ));
                    }
                })}
            </div>
        );
    };

    // Generate unique color for each issue (based on index)
    const getIssueColor = (index) => {
        // Array of distinct colors (bright, visible colors)
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

    const getSeverityLabel = (severity) => {
        switch (severity) {
            case 'high': return 'Nghiêm trọng';
            case 'medium': return 'Trung bình';
            case 'low': return 'Nhẹ';
            default: return severity;
        }
    };

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

    // Calculate match rate - sử dụng score từ backend (đã tính từ criteria_scores)
    // Backend đã tính % từ các tiêu chí với trọng số, nên chỉ cần dùng score đó
    const calculateMatchRate = () => {
        if (!reviewResult) return 0;
        
        // Backend đã tính score từ criteria_scores * weights
        // Score này chính là % phù hợp ước lượng
        return Math.max(0, Math.min(100, Math.round(reviewResult.score || 0)));
    };

    // Calculate potential improvement (ước lượng có thể cải thiện lên bao nhiêu)
    const calculatePotentialImprovement = () => {
        if (!reviewResult || !reviewResult.issues || reviewResult.issues.length === 0) {
            return null; // Không có issues → không cần cải thiện
        }
        
        const currentScore = calculateMatchRate();
        
        // Ước lượng: nếu sửa hết issues, có thể tăng thêm 10-20 điểm
        // Tùy vào số lượng và severity của issues
        let potentialIncrease = 0;
        
        reviewResult.issues.forEach(issue => {
            if (issue.severity === 'high') {
                potentialIncrease += 8; // High severity → sửa xong tăng ~8 điểm
            } else if (issue.severity === 'medium') {
                potentialIncrease += 5; // Medium severity → sửa xong tăng ~5 điểm
            } else if (issue.severity === 'low') {
                potentialIncrease += 2; // Low severity → sửa xong tăng ~2 điểm
            } else {
                potentialIncrease += 3; // No severity → sửa xong tăng ~3 điểm
            }
        });
        
        // Giới hạn tăng tối đa 25 điểm (không thể từ 50% lên 100% chỉ bằng sửa issues)
        potentialIncrease = Math.min(25, potentialIncrease);
        
        const potentialScore = Math.min(100, currentScore + potentialIncrease);
        
        return {
            current: currentScore,
            potential: potentialScore,
            increase: potentialIncrease
        };
    };

    const matchRate = calculateMatchRate();

    return (
        <div className="cv-review-page">
            <CandidateNav />
            
            <div className="cv-review-container">
                <div className="page-header">
                    <h1>AI Hỗ trợ CV</h1>
                    <p>Upload CV và JD để AI phân tích và đưa ra gợi ý sửa CV</p>
                </div>

                <div className="cv-review-content">
                    {/* Left: Upload Section */}
                    <div className="review-input-section">
                        {/* CV Upload */}
                        <div className="input-card">
                            <h3>
                                <i className="fas fa-file-pdf"></i>
                                Upload CV (1 chỗ duy nhất)
                            </h3>
                            <div className="file-upload-area">
                                <input
                                    ref={cvFileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleCVFileChange}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    onClick={() => cvFileInputRef.current?.click()}
                                    className="btn-upload"
                                    disabled={isUploadingCV}
                                >
                                    {isUploadingCV ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i>
                                            Đang upload...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            {cvFile ? cvFile.name : 'Chọn file CV'}
                                        </>
                                    )}
                                </button>
                                {cvFilePreview && (
                                    <div className="file-preview">
                                        <i className="fas fa-file-pdf"></i>
                                        <span>{cvFile.name}</span>
                                    </div>
                                )}
                                {cvText && (
                                    <div className="cv-status success">
                                        <i className="fas fa-check-circle"></i>
                                        CV đã được xử lý
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* JD Upload */}
                        <div className="input-card">
                            <h3>
                                <i className="fas fa-briefcase"></i>
                                Upload JD (Job Description) - Tối đa 5 chỗ
                            </h3>
                            {jdFileNames.map((fileName, index) => (
                                <div key={index} className="jd-upload-group">
                                    <label>JD {index + 1}</label>
                                    <input
                                        ref={el => jdFileInputRefs.current[index] = el}
                                        type="file"
                                        accept=".txt"
                                        onChange={(e) => handleJDFileChange(index, e)}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        onClick={() => jdFileInputRefs.current[index]?.click()}
                                        className="btn-upload-small"
                                    >
                                        <i className="fas fa-cloud-upload-alt"></i>
                                        {fileName ? fileName : 'Chọn file JD (.txt)'}
                                    </button>
                                    {jdErrors[index] && (
                                        <div className="jd-error">
                                            <i className="fas fa-exclamation-circle"></i>
                                            {jdErrors[index]}
                                        </div>
                                    )}
                                    {fileName && jdTexts[index] && !jdErrors[index] && (
                                        <div className="jd-status success">
                                            <i className="fas fa-check-circle"></i>
                                            Đã đọc file thành công
                                        </div>
                                    )}
                                    <textarea
                                        value={jdTexts[index] || ''}
                                        onChange={(e) => {
                                            const newJdTexts = [...jdTexts];
                                            newJdTexts[index] = e.target.value;
                                            setJdTexts(newJdTexts);
                                        }}
                                        placeholder="Hoặc nhập/paste JD text trực tiếp..."
                                        rows="4"
                                        className="form-textarea"
                                    />
                                    {jdFileNames.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveJD(index)}
                                            className="btn-remove"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                </div>
                            ))}
                            {jdFileNames.length < 5 && (
                                <button
                                    type="button"
                                    onClick={handleAddJD}
                                    className="btn-add-jd"
                                >
                                    <i className="fas fa-plus"></i> Thêm JD
                                </button>
                            )}
                        </div>

                        {/* Review Button */}
                        <button
                            onClick={handleReview}
                            disabled={!cvText || jdTexts.filter(t => t && t.trim()).length === 0 || isReviewing || isUploadingCV}
                            className="btn-review"
                        >
                            {isReviewing ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Đang phân tích... (2-3 phút)
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-search"></i>
                                    Phân tích CV
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right: Results */}
                    <div className="review-results-section">
                        {isReviewing && (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>AI đang phân tích CV của bạn...</p>
                                <p className="loading-note">Quá trình này có thể mất 2-3 phút</p>
                            </div>
                        )}

                        {reviewResult && !isReviewing && (
                            <div className="results-card">
                                {/* Score */}
                                <div className="score-section">
                                    <div className="score-circle" style={{
                                        background: `conic-gradient(#3498db ${reviewResult.score * 3.6}deg, #eee 0deg)`
                                    }}>
                                        <div className="score-inner">
                                            <span className="score-value">{reviewResult.score}</span>
                                            <span className="score-label">/100</span>
                                        </div>
                                    </div>
                                    <div className="score-status">
                                        <h3>
                                            {reviewResult.ready ? (
                                                <><i className="fas fa-check-circle text-success"></i> CV Chuẩn - Sẵn sàng nộp!</>
                                            ) : (
                                                <><i className="fas fa-exclamation-circle text-warning"></i> CV cần chỉnh sửa</>
                                            )}
                                        </h3>
                                        <p>{reviewResult.summary}</p>
                                    </div>
                                </div>

                                {/* Match Rate */}
                                <div className="match-rate-section">
                                    <h4>
                                        <i className="fas fa-percentage"></i>
                                        Mức độ phù hợp ước lượng
                                    </h4>
                                    <div className="match-rate-display">
                                        <div className="match-rate-circle" style={{
                                            background: `conic-gradient(#27ae60 ${matchRate * 3.6}deg, #eee 0deg)`
                                        }}>
                                            <div className="match-rate-inner">
                                                <span className="match-rate-value">{matchRate.toFixed(0)}</span>
                                                <span className="match-rate-label">%</span>
                                            </div>
                                        </div>
                                        <div className="match-rate-info">
                                            <p className="match-rate-interpretation">
                                                <strong>{reviewResult.matchRateInterpretation || 
                                                    (matchRate >= 85 ? 'Rất phù hợp / Short-list' :
                                                     matchRate >= 70 ? 'Phù hợp tốt' :
                                                     matchRate >= 60 ? 'Có thể phỏng vấn' :
                                                     'Cần chỉnh sửa CV')}</strong>
                                            </p>
                                            <p className="match-rate-note">
                                                (Ước lượng dựa trên JD và CV hiện tại)
                                            </p>
                                            {(() => {
                                                const improvement = calculatePotentialImprovement();
                                                if (improvement && improvement.increase > 0) {
                                                    return (
                                                        <p className="match-rate-improvement">
                                                            <i className="fas fa-arrow-up"></i>
                                                            Có thể cải thiện lên <strong>{improvement.potential}%</strong> nếu chỉnh sửa theo gợi ý
                                                        </p>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                </div>

                                {/* Issues List */}
                                {reviewResult.issues && reviewResult.issues.length > 0 && (
                                    <div className="issues-section">
                                        <h4>
                                            <i className="fas fa-exclamation-triangle"></i>
                                            Các vấn đề cần sửa ({reviewResult.issues.length})
                                        </h4>
                                        <div className="issues-list">
                                            {reviewResult.issues.map((issue, index) => {
                                                const issueColor = getIssueColor(index);
                                                return (
                                                    <div key={index} className="issue-item" style={{
                                                        borderLeft: `4px solid ${issueColor}`
                                                    }}>
                                                        <div className="issue-header">
                                                            <span className="issue-section">{getSectionLabel(issue.section)}</span>
                                                            <span className="issue-number" style={{
                                                                backgroundColor: issueColor,
                                                                color: '#fff'
                                                            }}>
                                                                Vấn đề {index + 1}
                                                            </span>
                                                        </div>
                                                        <div className="issue-content">
                                                            <p className="issue-text">
                                                                <strong>Vấn đề:</strong> {issue.original_text}
                                                            </p>
                                                            <p className="issue-suggestion">
                                                                <strong>Gợi ý:</strong> {issue.suggestion}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* CV Preview with Boxes */}
                                {cvText && (
                                    <div className="cv-preview-section">
                                        <h4>
                                            <i className="fas fa-file-alt"></i>
                                            CV Preview (với khoanh khung)
                                        </h4>
                                        <div className="cv-preview">
                                            {renderCVWithBoxes(cvText, reviewResult.issues || [])}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {!reviewResult && !isReviewing && (
                            <div className="empty-state">
                                <i className="fas fa-file-alt"></i>
                                <p>Kết quả phân tích sẽ hiển thị ở đây</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default CVReview;
