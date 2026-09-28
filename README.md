# AnNT — Personal Portfolio

Portfolio tĩnh bằng HTML, CSS và JavaScript thuần, được thiết kế theo ngôn ngữ editorial hiện đại: xanh–đen–trắng, hình học gợi liên tưởng đến mặt nước, typography giàu nhịp điệu và chuyển động có chủ đích. Toàn bộ hình ảnh nhận diện được dựng bằng HTML/CSS/SVG nguyên bản; không dùng artwork, logo hay tài sản từ trò chơi.

Nội dung dự án và số liệu hiện là dữ liệu demo. Đường dẫn liên hệ trỏ đến hồ sơ GitHub công khai của `AnNT-k7`.

## Chạy tại máy

Không cần bước build:

```bash
python3 -m http.server 8000
```

Mở `http://localhost:8000`. Có thể tắt JavaScript hoặc bật chế độ giảm chuyển động của hệ điều hành để kiểm tra các fallback hỗ trợ tiếp cận.

## Kiểm thử trình duyệt

```bash
npm install
npx playwright install chromium
npm test
```

Bộ test kiểm tra desktop/mobile, menu bàn phím, fallback khi JavaScript hoặc `IntersectionObserver` không hoạt động, và tùy chọn giảm chuyển động được lưu qua lần tải lại.

## Cá nhân hóa

- Cập nhật phần giới thiệu, năng lực, dự án demo và liên kết trong `index.html`.
- Chỉnh palette, typography và kích thước layout qua các biến ở đầu `styles.css`.
- Thay favicon bằng một SVG nguyên bản khác nếu đổi nhận diện.
- Giữ nhãn “demo” cho đến khi thay bằng dự án và thông tin liên hệ thật.

## Đưa lên GitHub Pages

Repository được phục vụ trực tiếp từ các file ở thư mục gốc, không qua framework hoặc bundler. Trong **Settings → Pages**, chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)`. File `.nojekyll` giúp GitHub Pages phát hành nguyên trạng các tài sản tĩnh.

Sau khi deploy, kiểm tra trang chính và các tài sản tương đối (`styles.css`, `script.js`, `favicon.svg`) đều trả về HTTP 200.
