# Cập nhật bảo hành, sản phẩm, tích điểm và tin tức

Cập nhật ngày 02/11/2026 theo các mẫu người dùng gửi. Phần giao diện trang chủ được giữ nguyên trong lượt chỉnh sửa này. Logo, menu chung, danh mục sản phẩm và giỏ hàng tiếp tục dùng phần đã đồng bộ.

## Thay đổi và file liên quan

| Trang | Nội dung | File |
| --- | --- | --- |
| Bảo hành | Bỏ ảnh đầu trang, dùng ô nhập Serial/IMEI và ba bước hướng dẫn; giữ chính sách và mục yêu cầu hỗ trợ | `warranty.html`, `css/warranty-lookup.css`, `js/warranty-lookup.js` |
| Sản phẩm | Thay ảnh hero bằng đúng collage tham khảo, căn giữa tiêu đề; giữ bộ lọc, danh mục, giỏ và liên kết 3D | `products.html`, `css/products-banner.css` |
| Tích điểm | Hero nâu đậm `#3b291f`, thương hiệu Góc Desk; bốn thẻ Bronze/Silver/Gold/Titan không có huy hiệu; sáu lựa chọn quà và voucher; lọc và xem chi tiết phần thưởng | `points.html`, `css/rewards.css`, `js/rewards.js` |
| Tin tức | Bố cục biên tập nền kem, chữ lớn, ảnh và nội dung không có khung thẻ; giữ bài viết, bộ lọc chủ đề và liên kết tới từng bài | `news.html`, `css/news-editorial.css`, `js/news-editorial.js` |

Các yêu cầu mới thay thế hero ảnh cũ của trang bảo hành, tích điểm và tin tức. Trang sản phẩm vẫn dùng ảnh phủ toàn chiều ngang với khung hero trang con. Các trang chi tiết sản phẩm, giỏ và 3D tiếp tục dùng header ảnh đã làm trước đó.

## Nguồn tham khảo và tài nguyên

- Bố cục tin tức tham khảo [Cocoon – Bài viết](https://cocoonvietnam.com/bai-viet). Nội dung và ảnh bài viết Góc Desk hiện có được giữ lại.
- Collage sản phẩm lấy từ [HyperWork – Tất cả sản phẩm](https://hyperwork.vn/collections/all), lưu tại `images/references/products-collage.svg`.
- Nét vẽ phần thưởng lấy từ [HyperWork Rewards](https://hyperwork.vn/pages/rewards), lưu bản gốc tại `images/references/rewards-line-art.svg`. Bản `rewards-line-art-brown.svg` đổi nền sang nâu đậm và màu nhấn sang nâu vàng; tên Góc Desk và tiêu đề được viết bằng HTML.
- URL tài nguyên gốc và các biến đổi nằm trong `images/references/sources.json`. Các SVG tải về đã được kiểm tra không chứa script, trình xử lý sự kiện hay liên kết tài nguyên ngoài.
- Thẻ thành viên, biểu tượng quà và voucher được dựng bằng CSS/SVG trong trang, không dùng ảnh huy hiệu.
- Mức điểm và quyền lợi dùng để minh họa theo mẫu, lưu trong `images/references/rewards-demo-policy.json`; chưa phải chính sách thương mại được xác nhận.

## Hành vi và giới hạn

- Tra cứu bảo hành kiểm tra định dạng đầu vào và hiển thị rõ việc chưa kết nối dữ liệu bảo hành. Không tự tạo trạng thái hay ngày hết hạn cho Serial/IMEI bất kỳ. Mã nhập không được lưu.
- Phần thưởng có bộ lọc Quà tặng/Voucher, hộp thoại chi tiết và nút lưu lựa chọn. Chỉ mã phần thưởng được lưu ở trình duyệt bằng khóa `goc-desk:reward-wishlist:v1`; không trừ điểm, phát hành mã voucher hay giả lập số dư tài khoản. Trường hợp không lưu được sẽ báo lỗi.
- Đăng nhập/đăng ký hiển thị thông tin về chức năng tài khoản chưa kết nối. Trang không yêu cầu nhập dữ liệu cá nhân.
- Tin tức hỗ trợ mở từng bài theo liên kết, đổi chủ đề, quay lại/tiến tới bằng trình duyệt và chủ đề Thiết kế 3D được giữ đúng tên.

## Cách xem và kiểm tra

Mở thư mục dự án bằng VS Code và chạy Live Server để các trang cùng địa chỉ website, rồi nhấn **Ctrl + Shift + R**. Xem lần lượt `warranty.html`, `products.html`, `points.html`, `news.html` ở chiều rộng máy tính và điện thoại.

Kiểm tra ô Serial/IMEI trống/sai/hợp lệ; lọc quà/voucher, mở chi tiết và lưu một lựa chọn rồi tải lại; đổi chủ đề và mở từng bài tin tức. Mở lại sản phẩm để kiểm tra bộ lọc, liên kết chi tiết và thêm giỏ vẫn hoạt động.

Với Node.js, chạy các bộ kiểm tra từ thư mục dự án:

```powershell
node -e "Promise.all(['catalog','cart','warranty-lookup','rewards','news-editorial'].map(async n => ({name:n,...await (await import('./tests/'+n+'.test.mjs')).run()}))).then(console.log)"
```

Đã chạy đạt **46 kiểm tra**: danh mục 16, giỏ hàng 15, bảo hành 7, phần thưởng 6, tin tức 2. Kiểm tra cấu trúc tám trang, ID trùng, đích fragment, 623 liên kết/tài nguyên nội bộ và ngoặc CSS không phát hiện lỗi. `git diff --check` đạt.

Các kiểm tra tương tác JavaScript chạy với bộ mô phỏng DOM, không thay thế kiểm tra giao diện thật. Chưa kiểm tra trực quan trong trình duyệt vì công cụ không kết nối được trình duyệt hiện có.


## Chỉnh trang chủ và video tin tức (09/11/2026)

Theo yêu cầu mới, thu chiều rộng nội dung trang chủ, danh mục và chi tiết sản phẩm xuống tối đa 1280px, giữ lề linh hoạt trên điện thoại. Ảnh sản phẩm dùng thêm khoảng đệm và nền xám đồng màu; chế độ hòa trộn darken nối nền ảnh vào khung để vật thể nhỏ hơn, không bị cắt. Ảnh danh mục dùng khung 4:3 để giảm chiều cao.

Khối “Mỗi góc bàn là một câu chuyện” ở trang chủ phát `images/Tik tok goc desk.mp4` và liên kết tới `news.html#news-desk-story`. Video và câu chuyện xuất hiện đầu trang tin tức; bài nổi bật cũ “Đẹp trên ảnh, đã hợp với bạn?” chuyển vào nhóm Cảm hứng setup, giữ nguyên nội dung và ID liên kết. Video giữ tỷ lệ gốc 5:4, có điều khiển phát trên trang tin tức. Dãy ba bài “Góc cảm hứng” ở trang chủ đã được bỏ.

File sửa: `index.html`, `news.html`, `css/home.css`, `css/product-interactions.css`, `css/news-editorial.css`, `tests/news-editorial.test.mjs` và tài liệu này. Video có sẵn trong thư mục images được tham chiếu trực tiếp, không tạo bản sao.

Kiểm tra thực tế: 27 kiểm tra đạt (danh mục 19, phần thưởng 6, tin tức 2); 126 liên kết/tài nguyên nội bộ ở trang chủ và tin tức tồn tại, không trùng ID, CSS cân bằng ngoặc, `git diff --check` đạt. Video có track hình 720×576, H.264 và âm thanh AAC. Hai bộ kiểm tra cũ giỏ hàng/bảo hành vẫn lỗi: DOM giả của giỏ thiếu `document.addEventListener`; kiểm tra bảo hành tìm ID không còn trong HTML. Các file đầu vào của hai bộ này không thay đổi so với HEAD trong lượt sửa này.

Chưa kiểm tra trực quan hoặc phát video trong trình duyệt vì Browser access host và native pipe không kết nối được. Để xem: mở thư mục dự án bằng VS Code Live Server, mở `index.html`, nhấn Ctrl+Shift+R; kiểm tra ảnh sản phẩm ở máy tính/điện thoại, nhấn khối video để sang đầu tin tức và thử các nút phát/âm thanh trên video.


## Nâng video lên 1080p (09/11/2026)

Tạo `images/goc-desk-1080p.mp4` từ video gốc `images/Tik tok goc desk.mp4`, giữ nguyên file gốc. Độ phân giải nâng từ 720×576 lên 1350×1080 theo tỷ lệ 5:4; giảm nhiễu nhẹ, nội suy Lanczos và làm nét nhẹ. Đây là upscale bằng bộ lọc, không phải phục hồi chi tiết bằng AI. Mã hóa H.264 CRF 17, 60 fps, yuv420p, MP4 faststart để tải trên website; âm thanh AAC được sao chép nguyên vẹn.

Cập nhật nguồn và kích thước video trong `index.html`, `news.html`. Bản 1080p khoảng 1,2 MB, giữ đủ 529 khung hình; checksum SHA-256 của track âm thanh trùng bản gốc. Đã giải mã kiểm tra toàn bộ video không báo lỗi và kiểm tra khung hình ở giây thứ 3 trước/sau. Nội suy giúp trình bày mượt hơn nhưng không tái tạo chi tiết đã mất trong nguồn nén thấp.

Thêm `height: auto` cho video trang chủ trong `css/home.css` để kích thước khai báo 1350×1080 vẫn co đúng tỷ lệ trên điện thoại. Đã xác nhận máy chủ xem trước trả HTTP 200 cho hai trang và file MP4 mới.


## Thu nhỏ thẻ danh mục trang chủ (09/11/2026)

Sửa `css/home.css`: chuyển sáu danh mục sang một hàng trên màn hình lớn (trước đây ba cột/hai hàng), giảm khoảng đệm và chiều cao vùng tên. Tablet tối đa 1100px dùng ba cột; điện thoại tối đa 640px dùng hai cột với đệm và chiều cao tên nhỏ hơn. Không đổi nội dung và liên kết danh mục.

Đã kiểm tra CSS cân bằng ngoặc, `git diff --check` đạt, máy chủ xem trước trả HTTP 200 với quy tắc sáu cột mới. Chưa kiểm tra trực quan trong trình duyệt. Xem tại `http://127.0.0.1:3000/goc-desk-ecommerce-project/index.html#shop-categories`, nhấn Ctrl+Shift+R. File sửa: `css/home.css`, tài liệu này.


## Thay video theo file mới (09/11/2026)

Theo yêu cầu, đổi nguồn video ở `index.html` và `news.html` sang đúng `images/TIKTOK gocdesk tintuc.mp4` (2700×2160, tỷ lệ 5:4, khoảng 68 MB). Cập nhật kích thước khai báo và liên kết mở video dự phòng. Tham chiếu trực tiếp file người dùng cung cấp, không nén hoặc chỉnh sửa file video. Các nút liên kết sang câu chuyện tin tức giữ nguyên.

Kiểm tra: máy chủ xem trước trả HTTP 200 cho cả hai trang với nguồn mới, không còn nguồn `goc-desk-1080p.mp4`; yêu cầu HEAD tới video mới trả HTTP 200. `git diff --check` đạt. Đã đọc được metadata H.264/AAC, chưa kiểm tra phát trực tiếp trong trình duyệt. File sửa: `index.html`, `news.html`, tài liệu này.


## Khớp khung với video mới (09/11/2026)

Sửa `css/home.css` và `css/news-editorial.css`: đặt tỷ lệ 5:4 trên khung chứa để khớp video 2700×2160. Video chiếm toàn bộ chiều rộng và chiều cao khung; bỏ giới hạn chiều cao 460px/560px vốn làm video bị chèn khoảng nền dư khi cột rộng. Tỷ lệ khung được giữ khi màn hình thay đổi, không cắt hình; giữ video, âm thanh và điều khiển hiện có.

Đã kiểm tra CSS cân bằng ngoặc; chưa kiểm tra trực quan trong trình duyệt. File sửa: hai CSS trên và tài liệu này. Xem trang chủ `index.html#community` hoặc `news.html#news-desk-story`, nhấn Ctrl+Shift+R.

## Carousel ảnh ở hero đầu trang chủ (11/11/2026)

Theo vị trí người dùng xác nhận, ba ảnh phòng thay ảnh nền cũ ngay trong hero đầu trang. Giữ nguyên hai nhãn Góc học tập/Góc làm việc, H1 “Sắp xếp góc riêng. Khơi nguồn cảm hứng.”, đoạn giới thiệu, hai nút Khám phá sản phẩm/Thử thiết kế 3D và liên kết Khám phá thêm của hero. Xóa toàn bộ khối giới thiệu 3D ở giữa trang. Hero dùng `section.hero-section#desk-studio` và `.hero-card.home-studio-gallery.home-studio-hero`; phần điều khiển gồm ba chấm và biểu tượng dừng/phát ở góc dưới trái, thanh tiến trình ở đáy. Các ảnh chỉ mang phần hình, không có tiêu đề, chú thích, bộ đếm hoặc CTA bổ sung trên trang.

Ba phối cảnh được tạo sẵn bằng AI, lưu thành tài nguyên tĩnh; website chỉ tải ảnh và không gọi dịch vụ tạo ảnh khi sử dụng. Phạm vi mã nguồn là `index.html`, `css/home.css`, `js/home.js` cùng ba ảnh WebP 1600×1000:

| File | Dung lượng |
| --- | ---: |
| `images/home-studio-focus.webp` | 172.318 byte |
| `images/home-studio-window.webp` | 217.566 byte |
| `images/home-studio-balcony.webp` | 238.124 byte |

Carousel dùng JavaScript thuần: giữ ảnh 5 giây, chuyển trong 800ms và lặp vòng bằng bản sao được ẩn khỏi công cụ hỗ trợ. Ba chấm chọn ảnh, biểu tượng dừng/phát và vuốt ngang dùng chung trạng thái. Tự chuyển ảnh dừng khi rê chuột, đặt focus trong hero, chuyển tab, cuộn hero khỏi màn hình hoặc người dùng bấm tạm dừng. Khi bật giảm chuyển động, người dùng đổi ảnh bằng thao tác và hiệu ứng dừng. Lớp chữ phủ trên ảnh cho thao tác vuốt đi qua; hai nút hero tiếp tục nhận nhấp chuột và bàn phím.

Ảnh đầu tải ngay với ưu tiên cao; hai ảnh sau khai báo tải lười và được chuẩn bị khi carousel khởi tạo. Giới hạn tải/giải mã là 10 giây mỗi ảnh. Ảnh lỗi bị loại khỏi vòng, còn tối đa một ảnh thì ẩn điều khiển. Nếu tất cả ảnh lỗi, nội dung và hai nút hero vẫn dùng được trên nền màu dự phòng. Khi tắt JavaScript, ảnh đầu và toàn bộ nội dung hero vẫn hiển thị. Nút Thử thiết kế 3D tới trang chuẩn `setup-3d.html`. URL CSS/JS trang chủ dùng phiên bản `20261111-hero2`.

### Xem trước và xác minh

Mở [hero trên máy cục bộ](http://127.0.0.1:5504/index.html?v=20261111-hero2), nhấn Ctrl+Shift+R. Địa chỉ chỉ dùng trên máy đang chạy máy chủ xem trước. Có thể mở bằng VS Code Live Server với cổng tương ứng.

[Kết quả hero](../plans/261111-0238-home-studio-carousel/reports/home-hero-browser-results.json) lúc `2026-11-11T03:14:25.240Z` ghi **19 trường hợp đạt, 0 lỗi, không có lỗi JavaScript trang**. Sau khi phát hiện lỗi căn giữa qua breakpoint, mã theo dõi kích thước viewport/slide và tính lại vị trí khi kích thước thực thay đổi. Lượt tập trung sau sửa xác minh 320/360/390/768/1366/1920px, đổi kích thước giữa chuyển cảnh và khôi phục sau `pagehide`/`pageshow`, sai lệch tâm tối đa 0,242px. Kiểm tra độc lập qua chuỗi 320→768→1366→768→320 ghi sai lệch tối đa 0,35px và observer ổn định.

Đã đối chiếu chính xác nội dung/link hero gốc, vị trí đầu trang và việc bỏ khối giữa; kiểm tra tải ảnh, hai vòng lặp, chấm chọn/bàn phím, dừng/phát, giảm chuyển động, ảnh lỗi, tắt JavaScript, hai CTA gốc, promo và thêm nhanh vào giỏ. Thao tác cảm ứng CDP xác minh vuốt qua cả ảnh lẫn chữ tiêu đề và cuộn dọc. [Ảnh desktop](../plans/261111-0238-home-studio-carousel/reports/hero-desktop.png) và [ảnh mobile](../plans/261111-0238-home-studio-carousel/reports/hero-mobile.png) dùng cho duyệt hero. Có thể chạy lại bằng `node plans/261111-0238-home-studio-carousel/reports/home-hero-browser.cjs` với máy chủ cổng 5504 và Playwright; đặt `PLAYWRIGHT_PATH` nếu đường dẫn module khác máy hiện tại.

Giới hạn: kiểm tra Chrome headless, chưa kiểm tra Safari/Firefox hoặc điện thoại thật. Trạng thái ẩn/hiện và vòng đời trang dùng sự kiện mô phỏng; chuyển tab nền thật/BFCache chưa được xác minh. Video cộng đồng được chặn vì ngoài phạm vi. Ảnh chụp ẩn header/thông báo chỉ trong lúc chụp để xem riêng hero. Bộ `home-studio-browser*`, `home-studio-verification.md` và ảnh `studio-*` được giữ làm bằng chứng lịch sử của phiên bản giữa trang.


## Chuẩn hóa trang thiết kế 3D (11/11/2026)

Chuyển giao diện 3D mới vào `setup-3d.html` để menu, trang chủ, trang sản phẩm, tài khoản và tin tức đều dùng một URL chuẩn. Giữ nội dung và tính năng 3D hiện hành, nhưng đưa CSS/JavaScript và ảnh về tên ổn định không có hậu tố `cap-nhat`; loại trang HTML và các bản CSS/JS cũ chỉ dùng bởi luồng trước. Phiên bản URL của menu được cập nhật để trình duyệt không tiếp tục dùng menu cũ đã cache. Favicon chung `images/favicon.png` được dùng trên trang chủ và trang 3D.

Các khóa lưu thiết kế hiện có (`goc-desk:studio-layout:cap-nhat:v2`, `goc-desk:studio-layout:cap-nhat:v1` và `goc-desk:studio-layout:v1`) được giữ nguyên để bố cục đã lưu vẫn còn khi người dùng cập nhật trang. URL 3D vẫn giữ query sản phẩm/màu và fragment `#setup-workspace`.

Đã chạy 22 kiểm tra Node.js gồm luồng 3D, khôi phục bố cục, liên kết danh mục và giỏ hàng; tất cả đạt. Trình duyệt Chrome mở trực tiếp `setup-3d.html` với tham số sản phẩm/màu, khởi tạo canvas 3D 861×360, chuyển qua ba cảnh, tải favicon và không ghi nhận lỗi JavaScript hay HTTP cục bộ. Kiểm tra hero trang chủ chạy lại sau khi đổi CTA, đạt 19/19 và không có lỗi JavaScript. Các kiểm tra trình duyệt dùng Chrome headless; chưa kiểm tra Safari/Firefox hoặc thiết bị thật. Three.js vẫn được tải từ CDN nên cần kết nối mạng khi mở công cụ 3D.
