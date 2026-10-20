# Bài 5 — Ứng dụng Mobile quản lý khóa học với MockAPI

**Link GitHub nộp bài:** [hieunofun/bai-5](https://github.com/hieunofun/bai-5).

**Video review code 2–3 phút:** [kịch bản và lời thoại](docs/thuyet-trinh.md).

React Native + Expo SDK 57 + TypeScript + Expo Router. Giao diện tiếng Việt, thiết kế cho điện thoại, hỗ trợ Android/iOS và bản web để kiểm tra.

## Chức năng

- Danh sách khóa học lấy từ MockAPI: ảnh URL, tên, giảng viên, tên danh mục và học phí VNĐ.
- Tìm theo tên có/không dấu, lọc theo danh mục, làm mới bằng nút hoặc kéo xuống.
- Chi tiết đầy đủ; phát trailer MP4 trong ứng dụng bằng `expo-video`.
- Form dùng chung cho thêm/sửa, dropdown danh mục từ API và xem trước ảnh URL.
- POST/PUT/DELETE khóa học; xác nhận trước khi xóa; tải lại danh sách sau mỗi thao tác.
- Thêm/sửa/xóa danh mục. Chặn xóa khi danh mục còn khóa học, kiểm tra lại danh sách mới từ API trước khi DELETE.
- Kiểm tra trường bắt buộc, học phí không âm, thời lượng > 0, danh mục tồn tại, URL ảnh HTTPS và trailer MP4 HTTPS.
- Trạng thái tải, lỗi mạng/timeout, dữ liệu rỗng và ảnh tải thất bại.
- Tab Kết nối kiểm tra hai resource trước khi lưu URL vào AsyncStorage trên thiết bị.

Ứng dụng đã cấu hình project MockAPI **QuanLyKhoaHoc** qua `.env`. Dữ liệu trong `data/mockapi-seed.json` chỉ dùng để nạp dữ liệu lên API; app luôn gọi API để đọc danh mục và khóa học.

## API của bài nộp

Base URL:

```text
https://6ace0da8f338359cf1c2fe99.mockapi.io/api/v1
```

- [Danh mục](https://6ace0da8f338359cf1c2fe99.mockapi.io/api/v1/categories): 3 danh mục mẫu.
- [Khóa học](https://6ace0da8f338359cf1c2fe99.mockapi.io/api/v1/courses): 10 khóa học mẫu, liên kết danh mục qua `categoryId`.
- App đọc cấu hình trong `.env`; khi clone repo, copy `.env.example` thành `.env`. Nếu thiết bị đã lưu một URL khác, đổi về URL này trong tab **Kết nối**.

## Cài đặt và chạy

Cài Node.js 22.13 trở lên (đã kiểm thử với Node.js 24):

```powershell
git clone https://github.com/hieunofun/bai-5.git
cd bai-5
npm ci
Copy-Item .env.example .env
npm start
```

Điện thoại: mở Expo Go tương thích SDK 57 và quét QR, dùng cùng mạng Wi-Fi. Bản Expo Go hỗ trợ `expo-video` và AsyncStorage. Nếu Expo Go trên máy chưa hỗ trợ SDK của dự án, dùng development build phù hợp; không tự hạ phiên bản SDK.

```powershell
npm run web          # kiểm tra trong trình duyệt
npm run android      # mở trên máy ảo/thiết bị Android đã kết nối
```

## Tạo project MockAPI

1. Vào [MockAPI](https://mockapi.io/), đăng nhập và tạo project.
2. Thiết lập prefix `/api/v1` nếu muốn. Tạo hai resource **cùng cấp**, tên chính xác `categories` và `courses`; không tạo courses thành resource con của categories.
3. Khai báo schema bên dưới. `id` dùng ID tự sinh của MockAPI. Nếu MockAPI tự tạo dữ liệu ngẫu nhiên, xóa dữ liệu đó trên dashboard trước khi chạy seed để dữ liệu đúng schema/quan hệ.
4. Sao chép **Base URL thật** trên dashboard (ví dụ dạng `https://<project-id>.mockapi.io/api/v1`). Mở tab **Kết nối** trong app, nhập URL và bấm **Kiểm tra và lưu kết nối**. Không nhập `/courses` hoặc `/categories` ở cuối.

Resource `categories`:

| Trường | Kiểu |
| --- | --- |
| id | Object ID / tự sinh |
| name | String |
| description | String |

Resource `courses`:

| Trường | Kiểu |
| --- | --- |
| id | Object ID / tự sinh |
| title | String |
| description | String |
| categoryId | String |
| instructor | String |
| price | Number |
| duration | Number |
| thumbnail | String |
| trailerUrl | String |
| createdAt | String |

Quan hệ: `courses.categoryId` phải bằng `categories.id` của một danh mục tồn tại. Tên danh mục hiển thị được tra từ dữ liệu `GET /categories`, không hardcode theo ID. `createdAt` được sinh bằng ISO string khi POST; PUT giữ nguyên ngày tạo.

## Nạp 3 danh mục và 10 khóa học mẫu

Project hiện tại đã có đủ 3 danh mục và 10 khóa học mẫu. Có thể chạy lại script dưới đây; các bản ghi trùng tên và danh mục sẽ được bỏ qua:

```powershell
npm run seed -- https://6ace0da8f338359cf1c2fe99.mockapi.io/api/v1
```

Script gọi GET/POST thật lên MockAPI, lấy ID danh mục trả về để liên kết khóa học. Script không xóa bản ghi; chạy lại bỏ qua danh mục trùng tên và khóa học trùng tên + danh mục. Nếu bị gián đoạn, có thể chạy lại. Không dùng chuỗi `<project-id>` nguyên văn.

Cách khác: copy `.env.example` thành `.env` rồi chạy `npm run seed` và `npm start`. URL nhập trong app được ưu tiên hơn biến môi trường. Khi đổi `.env`, tải lại hoàn toàn ứng dụng để nhận giá trị mới. Base URL là cấu hình công khai, không đặt khóa bí mật trong biến `EXPO_PUBLIC_*`.

Khóa học, giảng viên và học phí trong seed là dữ liệu minh họa, có khóa học miễn phí để kiểm tra giá 0. Ảnh mẫu từ Unsplash. Tất cả khóa học mẫu dùng video **Flower** (CC0) của MDN để kiểm tra phát MP4; đây là video minh họa, không phải trailer giảng dạy thật. Thay URL trong seed hoặc form nếu có tài nguyên riêng.

Nguồn ảnh: [ảnh laptop lập trình](https://unsplash.com/s/photos/laptop-code), [ảnh laptop của Alexander Nrjwolf](https://unsplash.com/photos/a-laptop-computer-sitting-on-top-of-a-desk-ysZnFnexwRE). Video mẫu: [MDN video element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video). Thư viện phát video theo [tài liệu expo-video SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/video/).

## REST API

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | /categories | Lấy danh mục |
| POST | /categories | Thêm danh mục |
| PUT | /categories/{id} | Sửa danh mục |
| DELETE | /categories/{id} | Xóa danh mục rỗng |
| GET | /courses | Lấy khóa học |
| GET | /courses/{id} | Lấy chi tiết |
| POST | /courses | Thêm khóa học |
| PUT | /courses/{id} | Sửa khóa học |
| DELETE | /courses/{id} | Xóa khóa học |

Client dùng `fetch`, JSON, kiểm tra HTTP status và timeout 15 giây. Sau khi lưu/xóa, client tải lại danh sách. Nếu mutation thành công nhưng tải lại thất bại, app giữ kết quả mutation và thông báo cần làm mới; không hiển thị mutation đã thành công thành một lần lưu thất bại. Ràng buộc danh mục được kiểm tra phía app theo yêu cầu đề; MockAPI không cung cấp transaction/khóa ngoại nên không thể bảo đảm chống thao tác đồng thời từ client khác.

## Cấu trúc mã nguồn

```text
src/app/index.tsx            Danh sách, tìm kiếm, lọc
src/app/courses/[id].tsx     Chi tiết, trailer, xóa
src/app/courses/form.tsx     Form thêm/sửa dùng chung
src/app/categories.tsx       CRUD danh mục
src/app/settings.tsx         Cấu hình kết nối
src/providers/              Trạng thái, đồng bộ dữ liệu, kiểm tra ràng buộc
src/services/api.ts         REST client và kiểm tra JSON trả về
src/types/course.ts         Kiểu Category/Course
src/utils/courses.ts        Validation, tìm kiếm, định dạng VNĐ
src/components/             Component giao diện, ảnh và video
src/constants/course-theme.ts Màu và font dùng chung
data/mockapi-seed.json       Dữ liệu mẫu cho script seed
scripts/seed-mockapi.mjs     Nạp dữ liệu lên MockAPI
scripts/test-domain.mjs      Kiểm tra validation và REST client
docs/thuyet-trinh.md         Kịch bản review code bài 5 trong 2–3 phút
```

Giao diện dùng theme sáng, phong cách phẳng, font Inter lưu trong `assets/fonts` với giấy phép OFL. Màu nhấn/font đổi tại `src/constants/course-theme.ts`. Chưa dựng dark mode.

## Kiểm tra

```powershell
npx expo lint
npx tsc --noEmit
npm test
```

Kiểm tra trên MockAPI thật: tải ít nhất 3 danh mục/10 khóa học; tìm/lọc; phát trailer; thêm/sửa/xóa khóa học; xác nhận và hủy xóa; thêm/sửa/xóa danh mục rỗng; chặn danh mục có khóa học; thử form trống/giá âm/danh mục không tồn tại; tắt mạng, tải lại và thử lại.

Kiểm tra ngày 20/10/2026: lint, TypeScript và cả 8 bài test tự động đều đạt. API thật trả về 3 danh mục và 10 khóa học. Đã chạy bản web ở kích thước điện thoại và xác nhận: tải danh sách, tìm không dấu, lọc danh mục, xem chi tiết, phát MP4, nạp dữ liệu vào form sửa và chặn lưu form trống; không có lỗi JavaScript trong các luồng này. Các request ghi dữ liệu và seed được kiểm tra bằng HTTP giả lập trong bộ test; lượt kiểm tra này không sửa dữ liệu API thật. Chưa kiểm thử trên thiết bị Android/iOS.

## Sản phẩm nộp

- Source code và README này.
- Base URL MockAPI thật đã ghi trong mục **API của bài nộp** ở trên.
- Quay video 2–3 phút theo [kịch bản review code](docs/thuyet-trinh.md), tập trung vào REST API, luồng dữ liệu, validation và kiểm tra ràng buộc. Kịch bản chưa phải video đã quay.

Tham khảo chính thức: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Expo Router](https://docs.expo.dev/router/introduction/), [MockAPI](https://github.com/mockapi-io/docs/wiki).
