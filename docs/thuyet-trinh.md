# Kịch bản review code bài 5 — khoảng 2 phút 50 giây

Link nộp source: https://github.com/hieunofun/bai-5

Đây là lời thoại và thao tác để tự quay video, chưa phải video đã quay. Các đoạn trích dẫn dưới đây là phần cần đọc; phần thao tác chỉ để chuẩn bị màn hình.

## Chuẩn bị trước khi quay

- Chạy `npm start` để mở bằng Expo Go, hoặc `npm run web` để demo trong trình duyệt. Khi clone repo mới, chạy `npm ci` và copy `.env.example` thành `.env` trước.
- Mở sẵn app, một khóa học có trailer và các file theo thứ tự: `src/types/course.ts`, `src/services/api.ts`, `src/providers/course-provider.tsx`, `src/utils/courses.ts`, `src/app/courses/form.tsx`, `src/app/index.tsx`.
- Trong IDE, dùng Ctrl+F tìm tên hàm ghi ở mỗi đoạn để chuyển nhanh. Chỉ đọc lời thoại, không đọc nguyên code; giữ cỡ chữ đủ lớn để thấy rõ.
- Dùng đồng hồ khi tập đọc. Nếu gần hết 3 phút, bỏ câu về `useMemo` ở đoạn cuối.

## 0:00–0:20 — Giới thiệu và demo ngắn

**Thao tác:** ở danh sách, nhập `lap trinh`, mở một khóa học; chỉ nút xem trailer, thêm/sửa/xóa.

> Em chào thầy cô. Đây là bài 5: ứng dụng quản lý khóa học bằng React Native, Expo và TypeScript. App lấy dữ liệu từ MockAPI, hỗ trợ tìm kiếm, lọc danh mục, xem chi tiết và trailer, cùng thêm, sửa, xóa khóa học và danh mục.

## 0:20–0:40 — Kiểu dữ liệu và tổ chức source

**Thao tác:** mở `src/types/course.ts`, chỉ `Category`, `Course` và `categoryId`; mở cây thư mục `src`.

> Em tách source thành màn hình, provider, service, kiểu dữ liệu và hàm tiện ích. Category và Course định nghĩa cấu trúc dữ liệu. Mỗi khóa học liên kết với danh mục qua categoryId. Các màn hình nằm trong src/app và điều hướng bằng Expo Router.

## 0:40–1:20 — REST API, phần chính cần review

**Thao tác:** mở `src/services/api.ts`; lần lượt tìm `createApi`, `request`, `saveCourse`, rồi `parseCourse`.

> File api.ts tập trung các request qua hàm request. GET lấy dữ liệu, POST tạo mới, PUT cập nhật và DELETE xóa. saveCourse dùng id để chọn POST hoặc PUT; ngày tạo chỉ được thêm khi tạo mới. Body được chuyển thành JSON, kèm Content-Type. Client kiểm tra response.ok, xử lý lỗi HTTP và dùng AbortController để giới hạn 15 giây. Sau đó parseCourse và parseCategory kiểm tra cấu trúc dữ liệu trả về trước khi đưa vào app.

## 1:20–1:55 — Quản lý dữ liệu và ràng buộc danh mục

**Thao tác:** mở `src/providers/course-provider.tsx`; tìm `refresh`, `syncAfterMutation`, `deleteCategory`.

> CourseProvider chia sẻ danh sách và trạng thái tải, lỗi giữa các màn hình. Promise.all tải khóa học và danh mục song song. Sau thao tác ghi, app cập nhật state và tải lại dữ liệu. Nếu tải lại lỗi, thông báo vẫn phân biệt thao tác ghi đã thành công. Trước khi xóa danh mục, app lấy lại toàn bộ khóa học và chặn xóa nếu còn bản ghi liên kết.

## 1:55–2:25 — Form và validation

**Thao tác:** mở `src/utils/courses.ts`, tìm `validateCourse`; chuyển sang `src/app/courses/form.tsx`, tìm `submit`.

> Form thêm và sửa dùng chung, phân biệt bằng id. validateCourse kiểm tra trường bắt buộc, học phí không âm, thời lượng lớn hơn không, danh mục tồn tại và URL ảnh HTTPS, video MP4 HTTPS. Hàm submit dừng khi có lỗi; dữ liệu hợp lệ mới được chuyển kiểu số và gửi qua provider tới API.

## 2:25–2:50 — Danh sách và kết thúc

**Thao tác:** mở `src/app/index.tsx`, chỉ `filtered` và `FlatList`; quay lại app, lọc theo danh mục.

> Màn danh sách dùng FlatList, kết hợp tìm tên không dấu và lọc danh mục. useMemo tính lại kết quả khi dữ liệu hoặc bộ lọc thay đổi. Trailer dùng expo-video. Dự án có kiểm tra lint, TypeScript và tám bài test tự động cho validation, REST client và seed dữ liệu. README có hướng dẫn chạy và link API. Em cảm ơn thầy cô.

## Ghi chú nếu được hỏi thêm

- AsyncStorage lưu Base URL trên thiết bị; danh sách khóa học và danh mục được đọc từ MockAPI.
- `data/mockapi-seed.json` dùng để nạp dữ liệu lên API, không thay thế request trong app. API của bài có 3 danh mục và 10 khóa học mẫu tại thời điểm chuẩn bị bài nộp.
- Trailer mẫu là video Flower của MDN để minh họa phát MP4, chưa phải video giảng dạy.
- Kiểm tra danh mục nằm phía client; MockAPI không có transaction/khóa ngoại để bảo đảm ràng buộc khi nhiều client sửa cùng lúc.
