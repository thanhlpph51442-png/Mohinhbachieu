# BẢO TÀNG SỐ 3D HIỆN VẬT LỊCH SỬ TỪ ẢNH (PHOTOGRAMMETRY)

Dự án website bảo tàng số chuyên nghiệp, giới thiệu và trưng bày mô hình ba chiều (3D) của các hiện vật lịch sử, văn hóa Việt Nam được tái tạo từ nhiều góc ảnh chụp thực tế bằng công nghệ **Photogrammetry**.

---

## 🏛️ 1. Giới Thiệu Dự Án & Mục Tiêu

- **Bảo tồn di sản không xâm lấn:** Ứng dụng công nghệ chụp ảnh đa góc độ kết hợp thuật toán tái cấu trúc từ chuyển động (Structure from Motion - SfM) để tạo nên bản sao kỹ thuật số 3D chuẩn xác đến từng chi tiết hoa văn mà không gây tổn hại đến hiện vật.
- **Trải nghiệm tương tác 3D trực tiếp:** Cho phép khách tham quan xem, xoay 360 độ, phóng to, thu nhỏ, kiểm tra kết cấu và các điểm chú thích khảo cổ học trực tiếp trên trình duyệt máy tính hoặc điện thoại mà không cần cài đặt thêm bất kỳ phần mềm nào.
- **Phong cách bảo tàng số hiện đại:** Thiết kế giao diện sang trọng, ấm cúng với tông màu nâu cổ điển (*classic brown*), vàng đồng hoàng gia (*bronze/antique gold*), trắng ngà (*ivory*) và đen huyền bí (*obsidian*).

---

## 🚀 2. Hướng Dẫn Khởi Động Website

### Cách 1: Khởi động nhanh bằng file batch
Nhấp đúp chuột vào file:
```cmd
start_server.bat
```

### Cách 2: Khởi động qua dòng lệnh (Command Line)
Mở PowerShell hoặc Command Prompt tại thư mục dự án `c:\tuan4` và chạy:
```cmd
.\node.bat server.js
```

Sau khi màn hình hiển thị:
```
🏛️ BẢO TÀNG SỐ 3D HIỆN VẬT TỪ ẢNH (PHOTOGRAMMETRY)
🚀 Server đang chạy tại: http://localhost:3000
```
Mở trình duyệt (Chrome, Edge, Firefox, Cốc Cốc, Opera) và truy cập vào địa chỉ:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧭 3. Cấu Trúc 5 Trang Cốt Lõi

| STT | Trang | Đường dẫn | Chức năng chính |
|---|---|---|---|
| **1** | **Trang Chủ (Home)** | [`index.html`](http://localhost:3000) | Giới thiệu dự án, sứ mệnh bảo tồn di sản, trình diễn mô hình 3D tương tác Trống Đồng Đông Sơn ngay tại màn hình chào, tóm tắt 4 bước công nghệ và các cổ vật tiêu biểu. |
| **2** | **Trang Hướng Dẫn (Guide)** | [`guide.html`](http://localhost:3000/guide.html) | **Phần A:** Cẩm nang kỹ thuật chụp 360° với thanh trượt tính toán độ chồng lấp 60–80% (Interactive Overlap Simulator), quỹ đạo 3 tầng góc chụp, thiết lập ánh sáng softbox, bảng Do's & Don'ts.<br>**Phần B:** 7 bước quy trình tái tạo 3D từ ảnh chụp đến WebGL và bảng so sánh các phần mềm (Meshroom, RealityCapture, Metashape). |
| **3** | **Trang Thư Viện (Gallery)** | [`gallery.html`](http://localhost:3000/gallery.html) | Danh mục trưng bày toàn bộ hiện vật với thanh tìm kiếm tức thì, bộ lọc theo phân loại (Đồ đồng, Gốm sứ, Sa thạch, Kim khí hoàng gia) và niên đại thời kỳ; hỗ trợ chuyển đổi giao diện xem dạng **Lưới (Grid)** hoặc **Danh sách (List)**. |
| **4** | **Trang Chi Tiết (Detail)** | [`detail.html?id=...`](http://localhost:3000/detail.html?id=trong-dong-dong-son) | Không gian triển lãm 3D độc lập: Điều khiển xoay 360°, phóng to/thu nhỏ, đổi chế độ hiển thị (*Chân thực, Khung lưới Wireframe, Khối thạch cao Clay, Tia X-Ray*), đổi preset ánh sáng (*Bảo tàng ấm, Studio trắng, Hoàng hôn*), toàn màn hình, chụp ảnh snapshot PNG, các điểm chú thích khảo cổ học (Hotspots) đính trên mô hình, bảng thông số kỹ thuật photogrammetry, bộ ảnh chụp thực tế đa góc và hồ sơ tư liệu lịch sử. |
| **5** | **Trang Quản Trị (Admin)** | [`admin.html`](http://localhost:3000/admin.html) | Dashboard thống kê di sản số hóa, bảng quản lý hiện vật đầy đủ chức năng **Thêm - Sửa - Xóa (CRUD)**, tải lên mô hình 3D mới (`.glb`, `.gltf`) và bộ ảnh thực tế với **Trình xem trước 3D (Live 3D Previewer)** trực tiếp trước khi lưu. |

---

## 🏺 4. Danh Mục 5 Hiện Vật Mẫu Đã Dựng 3D Sẵn

Mỗi hiện vật đều đi kèm file mô hình 3D `.glb` chuẩn Khronos glTF 2.0 Binary, bộ ảnh chụp góc độ thực tế và hồ sơ khảo cổ:

1. **Trống Đồng Đông Sơn Ngọc Lũ**
   - *Phân loại:* Đồ đồng khảo cổ | *Xếp hạng:* Bảo vật Quốc gia (Đợt 1)
   - *Niên đại:* Văn hóa Đông Sơn (Thế kỷ VII – II TCN)
   - *Đặc điểm 3D:* Tang trống phình, thân eo, chân choãi, mặt trống đúc nổi mặt trời 14 tia, đàn chim Lạc, 4 tượng cóc thiêng và quai kép bện thừng.
2. **Bình Gốm Hoa Lam Triều Lê Sơ**
   - *Phân loại:* Gốm sứ cổ truyền | *Xếp hạng:* Cổ vật quý hiếm dòng gốm Chu Đậu
   - *Niên đại:* Triều Hậu Lê (Thế kỷ XV)
   - *Đặc điểm 3D:* Dáng mai bình cân đối, men tro ngà bóng bẩy điểm xuyết hoa văn cánh sen và hoa cúc dây màu lam coban.
3. **Thạp Đồng Đào Thịnh**
   - *Phân loại:* Đồ đồng khảo cổ | *Xếp hạng:* Bảo vật Quốc gia
   - *Niên đại:* Văn hóa Đông Sơn (Thế kỷ V – I TCN)
   - *Đặc điểm 3D:* Nắp thạp đúc 4 khối tượng đôi nam nữ giao hoan biểu trưng tín ngưỡng phồn thực, thân thạp khắc 25 băng hoa văn đoàn chiến thuyền Lạc Việt.
4. **Tượng Bồ Tát Tara Đồng Dương**
   - *Phân loại:* Điêu khắc sa thạch cổ | *Xếp hạng:* Bảo vật Quốc gia
   - *Niên đại:* Phật giáo Chăm Pa thế kỷ IX (Phong cách Đồng Dương)
   - *Đặc điểm 3D:* Điêu khắc sa thạch nguyên khối, búi tóc Jatamukuta chạm Phật A Di Đà, thân hình ngực trần quyến rũ quấn váy xăm-pốt sarong mềm mại.
5. **Ấn Vàng "Hoàng Đế Chi Bảo"**
   - *Phân loại:* Kim khí hoàng gia | *Xếp hạng:* Bảo vật truyền quốc triều Nguyễn
   - *Niên đại:* Năm Minh Mạng thứ 4 (1823)
   - *Đặc điểm 3D:* Vàng ròng đúc đặc, núm rồng cuộn 5 móng (ngũ trảo) ngẩng cao đầu uy nghiêm, mặt đáy khắc 4 chữ triện "Hoàng Đế Chi Bảo".

---

## 🛠️ 5. Chi Tiết Công Nghệ Đã Xây Dựng

- **Backend & RESTful API:** Xây dựng trên nền tảng **Node.js** với đầy đủ các API:
  - `GET /api/artifacts`: Lọc theo từ khóa, danh mục, thời kỳ.
  - `GET /api/artifacts/:id`: Chi tiết hiện vật và các điểm hotspots.
  - `POST /api/artifacts`: Thêm mới hiện vật.
  - `PUT /api/artifacts/:id`: Cập nhật thông tin hiện vật.
  - `DELETE /api/artifacts/:id`: Xóa hiện vật khỏi hệ thống.
  - `POST /api/upload`: Xử lý tải lên tệp nhị phân mô hình 3D (.glb/.gltf) và ảnh chụp đa phần (Multipart/Form-Data).
  - `GET /api/stats`: Thống kê số lượng hiện vật, ảnh chụp, danh mục.
  - **Hỗ trợ HTTP Range Requests:** Truyền phát dữ liệu nhị phân mượt mà cho các mô hình 3D dung lượng lớn.
- **Trình Kết Xuất 3D Đa Nền Tảng (Hybrid 3D Engine):**
  - **Google `<model-viewer>`:** Chuẩn Web Component hiện đại nhất của Google hỗ trợ WebGL, WebXR, AR trên di động, bóng đổ thực tế (*shadow-intensity*), môi trường ánh sáng (*PBR lighting*), phơi sáng (*exposure*), tự động xoay và đính kèm các điểm ghim chú thích khảo cổ học.
  - **Three.js Standalone Fallback Engine:** Tích hợp bộ nạp WebGL Three.js với điều khiển `OrbitControls`, chiếu sáng đa điểm (Key light, Fill light, Rim light), và các chế độ phân tích chuyên sâu: *Realistic Texture, Wireframe, Clay Matcap, X-Ray*.
- **Thiết Kế Responsive:** Tương thích hoàn hảo từ màn hình máy tính để bàn độ phân giải cao đến máy tính bảng và điện thoại thông minh (hỗ trợ thao tác chạm ngón tay xoay 360° và chụm hai ngón tay để zoom).

---

## 📜 6. Cấu Trúc Thư Mục Dự Án

```
c:\tuan4\
├── node.bat                       # Trình bao bọc thực thi Node.js
├── start_server.bat               # File khởi động nhanh máy chủ bảo tàng
├── server.js                      # HTTP Server & REST API
├── package.json                   # Cấu hình dự án
├── README.md                      # Tài liệu hướng dẫn sử dụng
├── data/
│   └── artifacts.json             # Cơ sở dữ liệu hiện vật và hotspots
├── uploads/
│   ├── models/                    # Thư mục lưu trữ mô hình 3D người dùng tải lên
│   └── images/                    # Thư mục lưu trữ ảnh người dùng tải lên
├── scripts/
│   ├── generate_models.js         # Script tạo 5 mô hình 3D GLB nguyên bản
│   ├── generate_assets.js         # Script tạo sơ đồ kỹ thuật và bộ ảnh chụp
│   ├── test_in_memory.js          # Bộ kiểm thử tích hợp 23/23 tiêu chuẩn
│   └── test_api_mock.js           # Bộ kiểm thử API RESTful
└── public/
    ├── index.html                 # 1. Trang chủ
    ├── guide.html                 # 2. Trang hướng dẫn kỹ thuật 360° & 7 bước
    ├── gallery.html               # 3. Trang thư viện hiện vật
    ├── detail.html                # 4. Trang chi tiết & triển lãm 3D tương tác
    ├── admin.html                 # 5. Trang quản trị hiện vật
    ├── css/
    │   ├── style.css              # Giao diện tông màu cổ điển bảo tàng
    │   ├── viewer.css             # Thanh công cụ và hiệu ứng 3D
    │   └── responsive.css         # Tương thích thiết bị di động
    ├── js/
    │   ├── main.js                # Điều hướng chung và thông báo
    │   ├── gallery.js             # Tìm kiếm và bộ lọc hiện vật
    │   ├── detail.js              # Bộ điều khiển 3D và thư viện ảnh
    │   ├── guide.js               # Bộ mô phỏng Overlap và sơ đồ góc chụp
    │   ├── admin.js               # Quản lý CRUD và tải lên tệp 3D
    │   └── three-fallback.js      # Trình kết xuất Three.js dự phòng
    ├── models/                    # Tệp 3D GLB chuẩn Khronos glTF
    │   ├── trong-dong-dong-son.glb
    │   ├── binh-gom-hoa-lam.glb
    │   ├── thap-dong-dao-thinh.glb
    │   ├── tuong-cham-pa.glb
    │   └── an-vang-hoang-de.glb
    └── assets/
        ├── diagrams/              # Sơ đồ kỹ thuật chụp ảnh & quy trình
        └── images/                # Bộ ảnh đa góc độ thực tế
```

