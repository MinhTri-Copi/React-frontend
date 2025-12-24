import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import './PDFViewer.scss';

// Configure pdfjs worker - DÙNG FILE NỘI BỘ, KHÔNG DÙNG CDN
// IMPORTANT: Copy pdf.worker.min.js from node_modules/pdfjs-dist/build/ to public/
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.js`;

// Suppress deprecated API warnings from react-pdf
const originalWarn = console.warn;
const suppressedMessages = ['PDFDocumentProxy.fingerprint', 'please use', 'PDFDocumentProxy.fingerprints'];
console.warn = (...args) => {
    const message = args.join(' ');
    if (suppressedMessages.some(msg => message.includes(msg))) {
        // Suppress this specific warning
        return;
    }
    originalWarn.apply(console, args);
};

const PDFViewer = ({ fileUrl, onTextLayerReady, onLoadSuccess, onLoadError }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorDetails, setErrorDetails] = useState(null);
    const textLayerReadyPagesRef = useRef(new Set());

    const previousFileUrlRef = useRef(null);
    
    // Reset state when fileUrl changes
    useEffect(() => {
        if (fileUrl && fileUrl !== previousFileUrlRef.current) {
            previousFileUrlRef.current = fileUrl;
            setLoading(true);
            setError(null);
            setErrorDetails(null);
            setNumPages(null);
            textLayerReadyPagesRef.current.clear();
            console.log('📄 PDFViewer: Loading PDF');
        }
    }, [fileUrl]);

    const onDocumentLoadSuccess = useCallback(({ numPages }) => {
        setNumPages(numPages);
        setLoading(false);
        setError(null);
        setErrorDetails(null);
        if (onLoadSuccess) {
            onLoadSuccess({ numPages });
        }
    }, [onLoadSuccess]);

    const onDocumentLoadError = useCallback((error) => {
        console.error('❌ PDFViewer: Error loading PDF:', error);
        console.error('❌ PDFViewer: Error name:', error?.name);
        console.error('❌ PDFViewer: Error message:', error?.message);
        console.error('❌ PDFViewer: File URL:', fileUrl);
        
        let errorMessage = 'Không thể tải file PDF. Vui lòng kiểm tra lại file.';
        let details = null;

        // Provide more specific error messages
        if (error?.name === 'MissingPDFException') {
            errorMessage = 'File PDF không tồn tại hoặc không thể truy cập.';
            details = 'Kiểm tra xem file có tồn tại trên server không.';
        } else if (error?.name === 'InvalidPDFException') {
            errorMessage = 'File PDF không hợp lệ hoặc bị hỏng.';
            details = 'File có thể không phải là PDF hợp lệ.';
        } else if (error?.message?.includes('404')) {
            errorMessage = 'File PDF không tìm thấy (404).';
            details = `URL: ${fileUrl}`;
        } else if (error?.message?.includes('CORS')) {
            errorMessage = 'Lỗi CORS khi tải PDF.';
            details = 'Kiểm tra CORS headers trên server.';
        } else if (error?.message) {
            details = error.message;
        }

        setError(errorMessage);
        setErrorDetails(details);
        setLoading(false);
        if (onLoadError) {
            onLoadError(error);
        }
    }, [onLoadError, fileUrl]);

    const onTextLayerReadyCallback = useCallback((pageIndex) => {
        // Mark this page as ready
        textLayerReadyPagesRef.current.add(pageIndex + 1);
        
        // Wait a bit for text layer to fully render, then notify
        setTimeout(() => {
            if (onTextLayerReady) {
                try {
                    onTextLayerReady(pageIndex);
                } catch (error) {
                    console.error('Error in onTextLayerReady callback:', error);
                }
            }
        }, 100); // Reduced delay
    }, [onTextLayerReady]);

    // Memoize file object to prevent unnecessary re-renders
    // MUST be called before any early returns (React Hooks rules)
    const fileObject = useMemo(() => ({
        url: fileUrl,
        httpHeaders: {
            'Accept': 'application/pdf',
        },
        withCredentials: false,
    }), [fileUrl]);
    
    // Memoize options to prevent re-renders
    // MUST be called before any early returns (React Hooks rules)
    const documentOptions = useMemo(() => ({
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
    }), []);

    if (error) {
        return (
            <div className="pdf-viewer-error">
                <i className="fas fa-exclamation-triangle"></i>
                <p>{error}</p>
                {errorDetails && (
                    <p className="error-details">{errorDetails}</p>
                )}
                <p className="error-hint">
                    Kiểm tra:
                    <br />• File có tồn tại trên server không
                    <br />• CORS headers đã được cấu hình đúng chưa
                    <br />• Đường dẫn file PDF có đúng không
                </p>
                {fileUrl && (
                    <p className="error-url">
                        <small>URL: {fileUrl}</small>
                    </p>
                )}
            </div>
        );
    }

    if (!fileUrl) {
        return (
            <div className="pdf-viewer-empty">
                <i className="fas fa-file-pdf"></i>
                <p>Chưa có file PDF</p>
            </div>
        );
    }

    return (
        <div className="pdf-viewer-container">
            {loading && (
                <div className="pdf-viewer-loading">
                    <div className="spinner"></div>
                    <p>Đang tải PDF...</p>
                </div>
            )}
            <Document
                file={fileObject}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                    <div className="pdf-viewer-loading">
                        <div className="spinner"></div>
                        <p>Đang tải PDF...</p>
                    </div>
                }
                error={
                    <div className="pdf-viewer-error">
                        <i className="fas fa-exclamation-triangle"></i>
                        <p>Không thể tải file PDF</p>
                    </div>
                }
                options={documentOptions}
            >
                {Array.from(new Array(numPages), (el, index) => (
                    <div 
                        key={`page-${index + 1}`} 
                        className="pdf-page-wrapper"
                        data-page-number={index + 1}
                        style={{ position: 'relative' }}
                    >
                        <Page
                            pageNumber={index + 1}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            onRenderTextLayerSuccess={() => onTextLayerReadyCallback(index)}
                            className="pdf-page"
                            width={null}
                        />
                    </div>
                ))}
            </Document>
        </div>
    );
};

// Memoize component to prevent unnecessary re-renders
export default memo(PDFViewer);

