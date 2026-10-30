# **AI Usage Log**

## **Lần sử dụng 1**

### **Công cụ**

**Tên công cụ AI:** ChatGPT

### **Mục đích**

Sử dụng ChatGPT để phân tích yêu cầu dự án website thương mại điện tử **Góc Desk**. Mục tiêu là xác định vấn đề kinh doanh, khách hàng mục tiêu, phạm vi hệ thống, các chức năng cần có, quy trình mua hàng, yêu cầu phi chức năng và mức độ ưu tiên triển khai. Kết quả phân tích được dùng làm cơ sở để nhóm tiếp tục đánh giá và phản biện yêu cầu dự án bằng công cụ AI khác.

### **Prompt**

Phân tích yêu cầu cho dự án xây dựng website thương mại điện tử Góc Desk chuyên kinh doanh phụ kiện bàn làm việc và hỗ trợ khách hàng thiết kế, bố trí góc làm việc trực quan. Hãy xác định mục tiêu kinh doanh, vấn đề cần giải quyết, nhóm người dùng, phạm vi hệ thống, các chức năng chính, quy trình nghiệp vụ, yêu cầu phi chức năng, mức độ ưu tiên và rủi ro triển khai. Chú ý các chức năng mua hàng, quản lý sản phẩm và đơn hàng, thanh toán thử nghiệm (sandbox), vận chuyển, công cụ thiết kế góc làm việc 3D, lưu bộ setup và các chức năng AI hỗ trợ. Đánh giá tính khả thi trong thời gian 6 tuần với nhóm 7 thành viên, đồng thời đề xuất thứ tự triển khai phù hợp.

### **Kết quả đề xuất**

ChatGPT đề xuất xây dựng Góc Desk thành website thương mại điện tử kết hợp trải nghiệm thiết kế góc làm việc trực quan. Các nội dung chính gồm:

* **Nhóm người dùng:** khách vãng lai, khách hàng đã đăng ký và quản trị viên.  
* **Chức năng thương mại điện tử:** xem và tìm kiếm sản phẩm, quản lý tài khoản, giỏ hàng, đặt hàng, thanh toán, vận chuyển và quản trị hệ thống.  
* **Chức năng tạo khác biệt:** thiết kế góc làm việc 3D, lưu bộ setup và hỗ trợ khách hàng lựa chọn phụ kiện phù hợp.  
* **Yêu cầu phi chức năng:** giao diện responsive, bảo mật thông tin, quản lý dữ liệu nhất quán, khả năng kiểm thử và xử lý tình huống lỗi.  
* **Định hướng triển khai:** ưu tiên hoàn thiện quy trình mua hàng cơ bản trước; sau đó triển khai công cụ 3D và các tính năng AI theo khả năng kỹ thuật, thời gian và nguồn lực của nhóm.

### **Phản biện**

Theo nội dung phản biện bằng Gemini trong tài liệu dự án, nhóm nhận thấy một số điểm cần làm rõ trong đề xuất ban đầu:

* Website không nên chỉ dừng ở chức năng bán hàng vì chưa thể hiện rõ giá trị khác biệt của Góc Desk.  
* Công cụ thiết kế 3D có nguy cơ ảnh hưởng tiến độ nếu phạm vi mô hình và không gian thiết kế quá lớn.  
* Chức năng lưu bộ setup cần liên kết với dữ liệu sản phẩm và giỏ hàng để tránh việc khách phải chọn lại từng sản phẩm.  
* Cần quy định rõ cách xử lý giá bán, tồn kho, voucher, thanh toán, trạng thái đơn hàng và quyền truy cập.  
* Các chức năng AI cần được đánh giá về tính khả thi, chi phí tích hợp và khả năng kiểm thử; hình ảnh AI minh họa phải được phân biệt với hình ảnh sản phẩm thực tế.

### **Quyết định của nhóm**

Nhóm thống nhất định hướng giữ lại các chức năng thương mại điện tử cốt lõi và các chức năng tạo điểm khác biệt cho Góc Desk, đồng thời điều chỉnh phạm vi để phù hợp với thời gian thực hiện:

* **Giữ lại** các chức năng mua hàng, quản lý sản phẩm, giỏ hàng, đơn hàng, quản trị, thanh toán sandbox và vận chuyển.  
* **Giữ lại và giới hạn phạm vi** công cụ thiết kế 3D; ưu tiên một không gian mẫu và số lượng mô hình phù hợp với khả năng triển khai.  
* **Giữ lại, làm rõ yêu cầu** chức năng lưu bộ setup và kết nối với sản phẩm, giá bán và giỏ hàng.  
* **Bổ sung hoặc cụ thể hóa** các quy tắc nghiệp vụ về tồn kho, voucher, phân quyền, bảo mật và xử lý lỗi.  
* **Triển khai theo thứ tự ưu tiên**: hoàn thiện luồng mua hàng trước, kiểm tra tính khả thi của công cụ 3D sớm, sau đó tích hợp các chức năng AI tùy theo nguồn lực và kết quả thử nghiệm.

### **Người kiểm tra**

Sạch Thị Phương Trinh



# **Lần sử dụng 2 — Tạo ảnh minh họa cho trang Tin tức**

### **Công cụ**

**Tên công cụ AI:** ImageGen trong ChatGPT

### **Mục đích**

Tạo ảnh minh họa cho bài viết nổi bật và sáu thẻ bài viết trong `news.html`. Ảnh dùng để trình bày giao diện trang Tin tức; đây là ảnh minh họa do AI tạo, không phải ảnh sản phẩm thật và không được dùng để xác định thông tin sản phẩm, giá bán hoặc tồn kho.

### **Prompt tiêu biểu (diễn giải tiếng Việt)**

**Ảnh bài viết nổi bật:**

> Tạo ảnh chụp biên tập chân thực, khung ngang, về một góc làm việc tại nhà gọn gàng: bàn gỗ sồi sáng, bàn phím cơ nhỏ gọn, màn hình, cây xanh và phụ kiện được sắp xếp ngăn nắp. Ánh sáng tự nhiên ấm, phong cách ảnh sản phẩm cao cấp, tông kem, gỗ sáng, xanh sage và điểm nhấn than chì. Không có người, chữ, logo hay watermark.

**Ảnh bài viết về bàn phím:**

> Tạo ảnh sản phẩm chân thực, góc chụp từ trên xuống, khung ngang, gồm bàn phím cơ màu tối đặt cạnh sổ và bút trên bàn gỗ sồi sáng. Ánh sáng ban ngày dịu, tông kem, gỗ sáng, than chì và xanh sage. Không có chữ, logo hay watermark.

**Các ảnh bài viết còn lại:**

Tạo riêng ảnh khung ngang về góc làm việc nhỏ được tối ưu diện tích; nhóm phụ kiện bàn làm việc; đèn bàn và góc học tập buổi tối; phụ kiện bàn làm việc trong góc chụp studio; và một ý tưởng bố trí bàn làm việc 3D trên màn hình. Giữ phong cách ảnh sản phẩm chân thực, ánh sáng dịu, bảng màu trung tính ấm; không tạo chữ, logo hoặc watermark.

### **Cách sử dụng và kiểm tra**

Các ảnh được chọn, đổi sang định dạng JPG để giảm dung lượng, lưu trong thư mục `images/` rồi gắn vào ảnh nổi bật và sáu thẻ bài viết bằng thẻ HTML `<img>`. Mỗi ảnh có mô tả thay thế (`alt`); CSS dùng `object-fit: cover` để ảnh phù hợp với khung giao diện. Ảnh chỉ mang tính minh họa, không đại diện cho mẫu hàng đang bán.

### **Người kiểm tra**

Nhóm dự án kiểm tra giao diện và quyết định có tiếp tục sử dụng các ảnh minh họa này trong bản nộp hay không.


# **Lần sử dụng 3 — Làm mới ảnh và nội dung trang Tin tức (30/10/2026)**

### Công cụ và phạm vi

Codex hỗ trợ biên tập nội dung; ảnh được tạo bằng công cụ imagegen tích hợp (built-in), không dùng CLI hay API riêng. Yêu cầu là thay cả bộ ảnh và nội dung sáu thẻ bài, đồng thời đổi ảnh/nội dung bài nổi bật để các bài không trùng góc tiếp cận. Đây là tài nguyên biên tập tĩnh của trang Tin tức, không bổ sung tính năng AI vào website.

### Yêu cầu biên tập

> Viết lại cả nội dung lẫn ảnh theo hướng hiện đại, khác nhau rõ về chủ đề và phong cách hình ảnh; tiêu đề thu hút nhưng đúng nội dung. Giữ sáu thẻ bài theo wireframe, không hứa hẹn lượt xem, không tạo sự kiện hay lời chứng thực chưa xác minh. Các nhóm nội dung: bàn nhỏ, so sánh bàn phím, quản lý dây, ánh sáng, phối màu và trải nghiệm bố cục mẫu. Bài nổi bật bàn về chọn setup từ thói quen sử dụng.

### Các ảnh mới trong thư mục images/

- `news-editorial-hero.jpg`
- `news-small-workspace-v2.jpg`
- `news-keyboard-choice-v2.jpg`
- `news-cable-reset-v2.jpg`
- `news-evening-light-v2.jpg`
- `news-accent-palette-v2.jpg`
- `news-layout-3d-v2.jpg`

Ảnh được xuất JPG chất lượng 88 để giảm dung lượng. Ảnh bài viết là minh họa ý tưởng, không xác nhận mẫu sản phẩm thực tế; trang có dòng ghi nguồn ảnh AI. Hình 3D là minh họa khái niệm, không phải ảnh chụp giao diện hay bằng chứng rằng công cụ 3D thật đã hoàn tất.

### Bộ prompt tạo ảnh nguyên văn

#### 1. news-editorial-hero

```text
Use case: photorealistic-natural. Asset type: wide editorial hero image for a Vietnamese modern workspace accessories magazine. Create a premium contemporary design-magazine photograph, wide 16:9 horizontal. An inviting personal workspace in a real compact apartment, sculptural off-white desk with a thin matte black monitor, an open paper sketchbook, one cobalt blue metal task lamp, neutral keyboard, a walnut tray and one personal art print leaning against the wall. No repeated jungle of plants. Strong intentional composition, off-center three-quarter architectural view, generous breathing room, directional afternoon daylight with crisp natural shadows, authentic wood/paper/metal textures. Sophisticated offwhite, charcoal, walnut and cobalt palette. Feels lived-in yet carefully edited, compelling cover photograph, not a beige stock photo and not a showroom render. No people, no writing, no logos, no watermarks, no collage, no text overlay. The entire desk remains in safe central crop for website cards.
```

#### 2. news-small-workspace-v2

```text
Use case: photorealistic-natural. Asset type: blog card image about organizing a small desk. Premium contemporary editorial photograph, 16:10 landscape. A genuinely compact 90cm desk tucked into the corner of a small student apartment, photographed slightly overhead from doorway. Slim closed laptop on a stand at back, compact keyboard and mouse in clear main work zone, one A5 sketchbook with pen on the side, tiny wall shelf above to free the desk. Clear empty usable work surface. White desk, pale oak, small vivid cobalt accessory, white wall and natural morning window light. Young urban interior, fresh and minimal, believable physical scale and details. Main subject is the compact smart layout, not plants. No legible text, brand names, watermarks, collage, no fake screenshots. Balanced sophisticated image that crops well to 16:10.
```

#### 3. news-keyboard-choice-v2

```text
Use case: product-mockup. Asset type: editorial blog card illustrating compact keyboard versus full-size keyboard choice, not an actual product listing. Premium bold contemporary studio photograph, 16:10 horizontal. Top-down angled arrangement of exactly two unbranded physical keyboards: one small 65 percent compact keyboard and one full-size keyboard with clearly separate number pad, on a clean charcoal desk mat. Keycaps in graphite and soft ivory, a few cobalt accent keys, minimal blank keycaps rather than malformed writing. A computer mouse placed beside the compact keyboard makes space differences intuitive. Crisp realistic materials and precise geometry, beautifully controlled diagonal side light, modern tech magazine aesthetic, high clarity. Not gaming RGB, not beige lifestyle, no plants, no logos, no text labels, no watermark, no collage.
```

#### 4. news-cable-reset-v2

```text
Use case: photorealistic-natural. Asset type: blog card about cable organization. Contemporary editorial close-up photograph, wide 16:10. View from low oblique angle below a real light oak work desk, showing an accessible matte black cable tray mounted under the desk edge, a single properly supported power strip and several loosely organized black cables held with reusable soft hook-and-loop ties, all clean and physically believable, cables have relaxed bends, no exposed electrical wires or unsafe adapters. One cable runs neatly to a laptop dock visible at the far desk corner, no labels. Warm white interior with small burnt orange accessory in distant soft focus. Strong tactile detail and purposeful composition, natural daylight, subtly dramatic contrast. Focus on the cable tray and reusable ties, not generic tabletop, premium design tutorial imagery. No text, brand names, watermark, people, collage or before-and-after split.
```

#### 5. news-evening-light-v2

```text
Use case: photorealistic-natural. Asset type: editorial blog card about ambient lighting for an evening desk. Cinematic premium contemporary interior photograph, 16:10 horizontal. A compact modern desk at blue hour beside a window overlooking abstract city lights, pale tabletop, single sculptural adjustable desk lamp casting a contained warm pool of light onto an open notebook, a slim closed laptop and a ceramic mug, matte graphite lamp base and a tiny rust-orange accent. Deep navy twilight in the background with balanced amber light on foreground, genuine photographic texture, controlled highlights, attractive moody design-magazine framing. The notebook is blank or has no readable writing. Keep scene simple and clearly distinct from daylight office images. No neon gamer lighting, no people, no logos, no text overlay, no watermarks, no collage.
```

#### 6. news-accent-palette-v2

```text
Use case: product-mockup. Asset type: premium editorial still-life photograph about one accent color in workspace accessories, 16:10 landscape. A tightly art-directed contemporary tabletop composition on an offwhite desk: unbranded brushed-silver compact keyboard partially entering one side, a vivid burnt-orange notebook and small orange pen cup as repeated accent, muted grey felt desk mat and neutral ceramic tray. Include three small plain material/color swatches of ivory, warm grey and orange, with no letters. Focus on harmonious material textures and intentional color repetition. Top-down editorial framing with graphic diagonal sunlight and crisp soft-edged shadows, sophisticated European design-magazine look. Bold, clean, youthful and refined, not a crowded desk, no plants, no text, no logos, no product claims, no watermark, no collage.
```

#### 7. news-layout-3d-v2

```text
Use case: stylized-concept. Asset type: conceptual editorial image for a static HTML/CSS desk-layout prototype article. Create one polished modern isometric 3D render, wide 16:10, of a compact desk layout floating on a soft offwhite background: pale desk, charcoal monitor, keyboard, mouse, cobalt adjustable lamp, one small orange notebook. Subtle dotted placement outlines on the tabletop and a single clean blue selection outline around the lamp suggest planning object positions. Physically coherent desk and objects, clear dimensional shadows, high-end architecture visualization with warm subtle lighting, restrained cobalt and orange accents, lots of breathing room, central composition safe for blog crop. This is a conceptual layout illustration, not an app screenshot, no interface panels, no AR, no camera imagery, no chatbot, no lettering, no logos, no watermark, no collage.
```

### Cách tích hợp

Đổi nguồn ảnh, văn bản thay thế, tiêu đề, giới thiệu ngắn và phần nội dung mở bằng details/summary trong news.html. Mỗi ảnh gắn với đúng chủ đề. Giữ liên kết tới setup-3d.html, cập nhật bộ lọc CSS theo danh mục, thêm khung ảnh và hiệu ứng phóng nhẹ. Lời khuyên về tránh phản chiếu đèn lên màn hình có liên kết đến hướng dẫn môi trường làm việc của OSHA.

### Kiểm tra thực tế

Đã mở trang trên Chrome tại các độ rộng 1366, 768 và 390 px. Cả bảy ảnh nạp thành công; chiều rộng nội dung bằng chiều rộng khung nhìn nên không có tràn ngang. Bộ lọc trả về 2 bài cảm hứng, 2 bài hướng dẫn, 1 bài chọn phụ kiện và 1 bài trải nghiệm; Tất cả trả đủ 6 thẻ. Phần đọc tiếp mở được, liên kết trải nghiệm dẫn đến setup-3d.html và không ghi nhận lỗi JavaScript trên trang. Đã xem lại ảnh chụp giao diện; ảnh tải trễ cần cuộn qua các khu vực trước khi chụp toàn trang.


# Lần sử dụng 4 — Tạo ảnh nền riêng cho trang Tin tức và Thiết kế 3D (30/10/2026)

### Công cụ và mục đích

Ảnh được tạo bằng imagegen tích hợp trong Codex để bổ sung banner đầu trang cho hai trang được phân công. Hai ảnh dùng hai phong cách tách biệt; không lấy ảnh mẫu của trang thành viên. Chúng chỉ là ảnh nền minh họa, không thể hiện chức năng 3D đang hoạt động.

### Ảnh trang Tin tức: `images/news-hero-background.png`

> Use case: photorealistic-natural. Asset type: extra-wide website hero background for the Góc Desk editorial news page. Create a premium independent design-magazine photograph of a compact creative workspace in a modern Vietnamese apartment, clearly distinct from a generic beige desk setup: rich terracotta-red wall accent, dark walnut desk, cobalt-blue articulated task lamp, a single open sketchbook, sculptural charcoal keyboard, and one framed abstract art print. Late-afternoon directional sunlight creates expressive geometric shadows across the wall. Compose as a wide panoramic 16:7 background; keep the main furnishings low in the frame and reserve the upper-middle wall area as clean negative space for centered white website text. Contemporary editorial photography, tactile materials, bold but refined contrast, subtle film grain, authentic proportions. No people, no text, no lettering, no brand marks, no watermark, no collage. This is only a decorative page background, not a product listing.

### Ảnh trang Thiết kế 3D: `images/setup-3d-hero-background.png`

> Use case: stylized-concept. Asset type: wide website hero background for the Góc Desk desk-planning page. Create a polished isometric architectural visualization of a modular workspace planning concept, not a photograph: a floating pale stone desk platform seen from above at a 30-degree angle, with simple geometric monitor, keyboard, task lamp, laptop stand and cable tray arranged as movable components. Surround it with thin blueprint guide lines, subtle grid marks without numerals, and a midnight-indigo studio environment with cobalt-blue and muted lime accents. Dramatically different from a warm lifestyle photograph: precise, graphic, technical, spacious, premium product-design render. Extra-wide panoramic 16:7 composition; keep the central upper half deep navy and uncluttered for white title text, arrange the isometric desk low across the frame. Dimensional shadows, elegant rim lighting, crisp material edges. No words, labels, numbers, UI panels, logos, watermark, people, AR/camera motifs, or collage. Decorative background for a static HTML/CSS mockup, not a claim of real 3D functionality.

### Cách sử dụng

Ảnh được lưu trong `images/` và gắn làm nền cho riêng phần mở đầu của từng trang bằng CSS. Lớp phủ tối giúp chữ dễ đọc; vị trí nền được điều chỉnh ở màn hình nhỏ. Nội dung trên trang Thiết kế 3D vẫn mô tả đúng đây là mô phỏng CSS.
