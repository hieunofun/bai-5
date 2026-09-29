# Bài 2 — React Native (Expo)

Ứng dụng hiển thị sáu ô màu theo ảnh mẫu: hai ô ngang 1–2, ba ô đứng 3–5 và ô 6 bên dưới. Các ô giữ tỷ lệ khi đổi bề ngang màn hình.

## Công nghệ

- TypeScript, React Native và Expo SDK 57.
- Expo Router quản lý màn hình.

## Cài đặt và chạy

Cài Node.js LTS, sau đó chạy:

```powershell
git clone https://github.com/hieunofun/bai-2.git
cd bai-2
npm ci
npm start
```

- **Điện thoại:** cài Expo Go, kết nối cùng Wi-Fi với máy tính và quét mã QR trong terminal.
- **Trình duyệt:** nhấn `w` trong terminal, hoặc chạy `npm run web`.
- **Máy ảo Android:** khởi động máy ảo đã cài, sau đó nhấn `a` trong terminal.

## Xem và review code

- `src/app/index.tsx`: giao diện sáu ô, màu sắc, tỷ lệ kích thước và cỡ chữ.
- `src/app/_layout.tsx`: cấu hình điều hướng, ẩn thanh tiêu đề.
- `app.json`: tên và cấu hình ứng dụng.

Các ô được dựng bằng `View`, các số bằng `Text`. `flexDirection: 'row'` sắp xếp ba ô giữa theo hàng ngang. `aspectRatio` giữ tỷ lệ chiều rộng và chiều cao. `ScrollView` cho phép cuộn trên màn hình nhỏ.

## Kiểm tra

```powershell
npm run lint
npx tsc --noEmit
```

Máy phát triển hiện lưu dự án tại `D:\bai-tap-1-react-native`.
