# Setup PDF Viewer - Hướng dẫn cài đặt

## Bước 1: Cài đặt Dependencies

Sau khi cập nhật `package.json`, chạy:

```bash
cd React-frontend
npm install
```

## Bước 2: Copy PDF.js Worker File (QUAN TRỌNG)

**⚠️ KHÔNG BỎ QUA BƯỚC NÀY** - PDF Viewer sẽ không hoạt động nếu thiếu worker file.

### Cách 1: Dùng lệnh (Windows PowerShell)

```powershell
Copy-Item "node_modules\pdfjs-dist\build\pdf.worker.min.js" -Destination "public\pdf.worker.min.js"
```

### Cách 2: Dùng lệnh (Linux/Mac)

```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/pdf.worker.min.js
```

### Cách 3: Copy thủ công

1. Mở thư mục `React-frontend/node_modules/pdfjs-dist/build/`
2. Tìm file `pdf.worker.min.js`
3. Copy file này
4. Paste vào thư mục `React-frontend/public/`
5. Đảm bảo tên file là `pdf.worker.min.js` (chính xác)

## Bước 3: Kiểm tra

Sau khi copy, kiểm tra:
- File `React-frontend/public/pdf.worker.min.js` phải tồn tại
- Kích thước file khoảng 1-2 MB

## Lưu ý

- **KHÔNG dùng CDN** cho worker file vì:
  - Phụ thuộc mạng ngoài
  - Version trên CDN có thể lệch với package.json → lỗi render trắng trang
- Worker file phải khớp version với `pdfjs-dist` trong `package.json`
- Nếu update `pdfjs-dist`, phải copy lại worker file

## Troubleshooting

### Lỗi: "Failed to load PDF document"
- Kiểm tra CORS headers trên backend (xem `Node-backend/src/server.js`)
- Kiểm tra đường dẫn PDF URL có đúng không

### Lỗi: "Worker failed to load"
- Kiểm tra file `public/pdf.worker.min.js` có tồn tại không
- Kiểm tra console có lỗi 404 không
- Đảm bảo file được copy đúng vị trí

### PDF render trắng trang
- Kiểm tra version worker file khớp với `pdfjs-dist` version
- Xóa cache browser và reload
- Kiểm tra console có lỗi gì không

