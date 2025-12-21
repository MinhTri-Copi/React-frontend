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
    const [jdFiles, setJdFiles] = useState([null]); // Tối đa 5 JD files
    const [jdTexts, setJdTexts] = useState(['']); // JD texts (from file or manual input)
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

    // Extract text from JD files (only for .txt files)
    useEffect(() => {
        extractJDTexts();
    }, [jdFiles]);

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
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Chỉ chấp nhận file PDF, DOC, DOCX, TXT!');
            return;
        }

        // Update JD files array
        const newJdFiles = [...jdFiles];
        newJdFiles[index] = file;
        setJdFiles(newJdFiles);
    };

    const handleAddJD = () => {
        if (jdFiles.length < 5) {
            setJdFiles([...jdFiles, null]);
            setJdTexts([...jdTexts, '']);
            jdFileInputRefs.current.push(React.createRef());
        } else {
            toast.warning('Tối đa 5 JD được phép!');
        }
    };

    const handleRemoveJD = (index) => {
        if (jdFiles.length > 1) {
            const newJdFiles = jdFiles.filter((_, i) => i !== index);
            const newJdTexts = jdTexts.filter((_, i) => i !== index);
            setJdFiles(newJdFiles);
            setJdTexts(newJdTexts);
        }
    };

    const extractJDTexts = async () => {
        setIsExtractingJD(true);
        const extractedTexts = [...jdTexts]; // Keep existing texts

        for (let i = 0; i < jdFiles.length; i++) {
            const file = jdFiles[i];
            if (!file) {
                // Keep existing text if no file
                if (!extractedTexts[i]) extractedTexts[i] = '';
                continue;
            }

            try {
                // For text files, read directly
                if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                    const text = await file.text();
                    extractedTexts[i] = text;
                } else {
                    // For PDF/DOCX, keep existing text or empty
                    // User can paste text manually
                    if (!extractedTexts[i]) {
                        extractedTexts[i] = '';
                        toast.info(`JD ${i + 1}: File ${file.type.includes('pdf') ? 'PDF' : 'DOCX'} - Vui lòng copy text từ file và paste vào ô bên dưới, hoặc dùng file .txt`);
                    }
                }
            } catch (error) {
                console.error(`Error extracting JD ${i + 1}:`, error);
                if (!extractedTexts[i]) extractedTexts[i] = '';
            }
        }

        setJdTexts(extractedTexts);
        setIsExtractingJD(false);
    };

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

        // Normalize text for matching
        const normalizeText = (str) => {
            return str.replace(/\s+/g, ' ').trim().toLowerCase();
        };

        // Create issue map
        const issueMap = new Map();
        issues.forEach((issue, index) => {
            if (issue.original_text && issue.original_text.trim()) {
                const originalText = issue.original_text.trim();
                const normalizedText = normalizeText(originalText);
                issueMap.set(normalizedText, {
                    ...issue,
                    index,
                    originalText: originalText,
                    normalizedText: normalizedText
                });
            }
        });

        // Find issue positions in text
        const issuePositions = [];
        const normalizedCV = normalizeText(text);
        
        issueMap.forEach((issueInfo) => {
            const searchText = issueInfo.normalizedText;
            let foundIndex = normalizedCV.indexOf(searchText);
            
            if (foundIndex !== -1) {
                // Map back to original position (approximate)
                let originalIndex = 0;
                let normalizedIndex = 0;
                
                // Simple mapping: count characters
                const ratio = text.length / normalizedCV.length;
                originalIndex = Math.floor(foundIndex * ratio);
                
                issuePositions.push({
                    start: originalIndex,
                    end: Math.min(text.length, originalIndex + issueInfo.originalText.length),
                    issue: issueInfo
                });
            }
        });

        // Sort and filter overlaps
        issuePositions.sort((a, b) => a.start - b.start);
        const filteredPositions = [];
        let lastEnd = 0;
        
        issuePositions.forEach(pos => {
            if (pos.start >= lastEnd) {
                filteredPositions.push(pos);
                lastEnd = pos.end;
            }
        });

        // Build parts with highlights
        const parts = [];
        let lastIndex = 0;

        filteredPositions.forEach((pos) => {
            if (pos.start > lastIndex) {
                parts.push({
                    text: text.substring(lastIndex, pos.start),
                    isIssue: false
                });
            }
            parts.push({
                text: text.substring(pos.start, pos.end),
                isIssue: true,
                issue: pos.issue
            });
            lastIndex = pos.end;
        });

        if (lastIndex < text.length) {
            parts.push({
                text: text.substring(lastIndex),
                isIssue: false
            });
        }

        // Render as HTML document (like PDF)
        return (
            <div className="cv-document">
                {parts.map((part, partIndex) => {
                    if (part.isIssue && part.issue) {
                        const severityColor = getSeverityColor(part.issue.severity);
                        const severityClass = `cv-highlight-${part.issue.severity}`;
                        
                        // Split by lines to preserve formatting
                        const lines = part.text.split('\n');
                        return lines.map((line, lineIdx) => (
                            <span
                                key={`issue-${partIndex}-${lineIdx}`}
                                className={`cv-highlight ${severityClass}`}
                                data-severity={part.issue.severity}
                                data-section={part.issue.section}
                                title={`${getSectionLabel(part.issue.section)} - ${getSeverityLabel(part.issue.severity)}: ${part.issue.suggestion}`}
                            >
                                {line}
                                {lineIdx < lines.length - 1 && <br />}
                            </span>
                        ));
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

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return '#ff4444';
            case 'medium': return '#ffaa00';
            case 'low': return '#44aaff';
            default: return '#999';
        }
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

    // Calculate match rate (job_matching score from rubric)
    const calculateMatchRate = () => {
        if (!reviewResult || !reviewResult.issues) return 0;
        
        // Get job_matching issues
        const jobMatchingIssues = reviewResult.issues.filter(issue => issue.section === 'job_matching');
        
        // Calculate based on score and issues
        // If score >= 80 and no high severity job_matching issues, match rate is high
        if (reviewResult.score >= 80 && !jobMatchingIssues.some(i => i.severity === 'high')) {
            return Math.min(100, reviewResult.score + 10);
        }
        
        // Otherwise, use score as base, adjusted by job_matching issues
        let matchRate = reviewResult.score;
        jobMatchingIssues.forEach(issue => {
            if (issue.severity === 'high') matchRate -= 15;
            else if (issue.severity === 'medium') matchRate -= 10;
            else if (issue.severity === 'low') matchRate -= 5;
        });
        
        return Math.max(0, Math.min(100, matchRate));
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
                            {jdFiles.map((file, index) => (
                                <div key={index} className="jd-upload-group">
                                    <label>JD {index + 1}</label>
                                    <input
                                        ref={el => jdFileInputRefs.current[index] = el}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt"
                                        onChange={(e) => handleJDFileChange(index, e)}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        onClick={() => jdFileInputRefs.current[index]?.click()}
                                        className="btn-upload-small"
                                    >
                                        <i className="fas fa-cloud-upload-alt"></i>
                                        {file ? file.name : 'Chọn file JD'}
                                    </button>
                                    {file && file.type === 'text/plain' && jdTexts[index] && (
                                        <div className="jd-status success">
                                            <i className="fas fa-check-circle"></i>
                                            Đã extract text
                                        </div>
                                    )}
                                    <textarea
                                        value={jdTexts[index] || ''}
                                        onChange={(e) => {
                                            const newJdTexts = [...jdTexts];
                                            newJdTexts[index] = e.target.value;
                                            setJdTexts(newJdTexts);
                                        }}
                                        placeholder={file && !file.name.endsWith('.txt') ? 'Paste text từ file PDF/DOCX vào đây...' : 'Hoặc nhập/paste JD text trực tiếp...'}
                                        rows="4"
                                        className="form-textarea"
                                    />
                                    {jdFiles.length > 1 && (
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
                            {jdFiles.length < 5 && (
                                <button
                                    type="button"
                                    onClick={handleAddJD}
                                    className="btn-add-jd"
                                >
                                    <i className="fas fa-plus"></i> Thêm JD
                                </button>
                            )}
                            {isExtractingJD && (
                                <div className="extracting-status">
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Đang extract text từ JD...
                                </div>
                            )}
                        </div>

                        {/* Review Button */}
                        <button
                            onClick={handleReview}
                            disabled={!cvText || jdTexts.filter(t => t && t.trim()).length === 0 || isReviewing || isUploadingCV || isExtractingJD}
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
                                        background: `conic-gradient(${getSeverityColor('low')} ${reviewResult.score * 3.6}deg, #eee 0deg)`
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
                                        Tỷ lệ CV phù hợp với JD
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
                                        <p className="match-rate-note">
                                            {matchRate >= 80 ? 'CV rất phù hợp với JD' : 
                                             matchRate >= 60 ? 'CV khá phù hợp với JD' : 
                                             'CV cần cải thiện để phù hợp hơn với JD'}
                                        </p>
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
                                            {reviewResult.issues.map((issue, index) => (
                                                <div key={index} className="issue-item" style={{
                                                    borderLeft: `4px solid ${getSeverityColor(issue.severity)}`
                                                }}>
                                                    <div className="issue-header">
                                                        <span className="issue-section">{getSectionLabel(issue.section)}</span>
                                                        <span className="issue-severity" style={{
                                                            backgroundColor: getSeverityColor(issue.severity),
                                                            color: '#fff'
                                                        }}>
                                                            {getSeverityLabel(issue.severity)}
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
                                            ))}
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
