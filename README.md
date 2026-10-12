# 🖊️ WhiteBoard — Bảng trắng tương tác cho giảng dạy

Chương trình bảng trắng (whiteboard) cộng tác theo **thời gian thực (real-time)** dành cho
**giáo viên** và **học sinh**. Server được **tự host ngay trên máy của giáo viên**, không cần
dịch vụ đám mây nào.

## ✨ Tính năng

### Công cụ vẽ
- Bút vẽ (Pen) mượt với nét cong (bezier)
- Tẩy (Eraser)
- Đường thẳng, mũi tên
- Hình chữ nhật, hình elip (giữ `Shift` để vẽ hình vuông/tròn)
- Văn bản (Text)
- Ghi chú dán (Sticky Note)
- Chèn hình ảnh (Image)
- Con trỏ laser (Laser pointer) cho bài giảng
- Chọn / di chuyển / xoay / thay đổi kích thước đối tượng

### Bảng vẽ
- Zoom in/out (cuộn chuột có `Ctrl`), pan (giữ chuột giữa hoặc `Alt` + kéo, hoặc công cụ Bàn tay)
- Lưới nền và cắm vào lưới (snap to grid) — bật/tắt
- Hoàn tác / làm lại (`Ctrl+Z` / `Ctrl+Y`)
- Nhân bản (`Ctrl+D`), chọn tất cả (`Ctrl+A`), xóa (`Delete`)
- Xuất PNG / SVG
- Panel **Lớp** (Layers): ẩn/hiện, khóa, sắp xếp thứ tự, nhân bản, xóa

### Cộng tác Real-time
- Đồng bộ mọi thao tác vẽ/nội dung tức thì giữa giáo viên và học sinh
- Hiển thị **con trỏ của từng người** kèm tên
- Panel **Thành viên**: quản lý người tham gia
- Panel **Thảo luận** (chat real-time)
- Phân quyền: giáo viên cấp/thu quyền vẽ & chat cho học sinh, hoặc loại khỏi phòng

### Giao diện
- UI hiện đại, lấy cảm hứng từ design system *threeui*
- Chế độ Sáng / Tối / Theo hệ thống
- Toàn bộ giao diện tiếng Việt

## 🚀 Cài đặt & chạy

```powershell
# 1. Cài đặt phụ thuộc
npm install

# 2. Chế độ phát triển (Vite + server tự động reload)
npm run dev
#   → Giao diện: http://localhost:5173
#   → WebSocket server: ws://localhost:3001

# 3. Chạy cho lớp học thật (build giao diện + mở server cho giáo viên)
npm start
#   → Giáo viên mở http://localhost:3001
#   → Học sinh trong cùng mạng LAN mở http://<IP-máy-giáo-viên>:3001
```

> **Mẹo:** Chạy `ipconfig` để lấy địa chỉ IPv4 của máy giáo viên (ví dụ `192.168.1.10`),
> sau đó học sinh truy cập `http://192.168.1.10:3001`. Có thể cần mở firewall cho cổng `3001`.

## 👩‍🏫 Hướng dẫn sử dụng

1. **Giáo viên**: chọn *Tạo phòng (Giáo viên)* → nhập tên + tên lớp → nhấn **Chia sẻ phòng** để
   lấy mã phòng / đường dẫn gửi cho học sinh.
2. **Học sinh**: chọn *Tham gia phòng (Học sinh)* → nhập tên + mã phòng.
3. Giáo viên có thể cấp/thu **quyền vẽ** và **quyền chat** cho từng học sinh trong panel
   *Thành viên*.

## ⌨️ Phím tắt

| Phím | Chức năng | | Phím | Chức năng |
|------|-----------|---|------|-----------|
| `V` | Chọn | | `T` | Văn bản |
| `H` | Bàn tay | | `N` | Ghi chú |
| `P` | Bút vẽ | | `I` | Hình ảnh |
| `E` | Tẩy | | `K` | Con trỏ laser |
| `L` | Đường thẳng | | `Ctrl+Z` | Hoàn tác |
| `A` | Mũi tên | | `Ctrl+Y` | Làm lại |
| `R` | Hình chữ nhật | | `Ctrl+D` | Nhân bản |
| `O` | Hình tròn | | `Delete` | Xóa |
| `G` | Bật/tắt lưới | | `+` / `-` | Zoom |
| `Shift+G` | Cắm lưới | | `0` | Reset zoom |

## 🏗️ Kiến trúc

```
WhiteBoard/
├── server/           # WebSocket + HTTP server (tự host) — Hono thuần Node/ws
│   └── index.ts
├── src/
│   ├── components/
│   │   ├── ui/       # Button, IconButton, Tooltip, Dropdown, ColorPicker, Slider, Panel
│   │   ├── whiteboard/  # Canvas, Toolbar, TopBar, BottomBar
│   │   └── panels/   # Lobby, RoomModal, ShareModal, Participants, Chat, Layers, Settings
│   ├── hooks/        # useWebSocket, useKeyboardShortcuts
│   ├── types/        # Kiểu dữ liệu & hằng số
│   ├── utils/        # geometry, color, id, cn
│   ├── App.tsx
│   └── styles.css    # Design system (CSS variables, light/dark)
├── index.html
└── package.json
```

- **Giao thức real-time**: WebSocket với các message `join-room`, `element-create`,
  `element-update`, `element-delete`, `cursor-move`, `chat-message`, `clear-canvas`,
  `room-settings-update`, … (định nghĩa tại `src/types/index.ts` → `WSEvents`).
- **Server** lưu trạng thái bảng (elements) theo từng phòng và là nguồn dữ liệu chuẩn khi
  thành viên mới tham gia.

## 🛠️ Công nghệ

React 18 · TypeScript · Vite · `ws` (WebSocket) · Canvas 2D
