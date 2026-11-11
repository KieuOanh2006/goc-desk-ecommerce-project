/* =========================================================
   GÓC DESK — LAYOUT CHUNG (HEADER + FOOTER)
   1. Markup header/footer
   2. Render vào slot
   3. Active navigation
   4. Khởi tạo

   Cách dùng trong mỗi trang (script KHÔNG defer, đặt ngay sau slot header
   để header có mặt trước khi trình duyệt vẽ trang):

       <div id="site-header-slot"></div>
       <script src="js/layout.js"></script>
       <main id="...">...</main>
       <div id="site-footer-slot"></div>

   Không dùng fetch nên chạy được cả khi mở file trực tiếp (file://).
   Thông báo là popup nổi (không chiếm chỗ trong header), chỉ hiện khi
   <body> có class "home-page"; hiệu ứng chạy chữ do js/home.js đảm nhiệm.
   ========================================================= */

(() => {
    "use strict";

    /* 1. MARKUP */

    const announcementMarkup = `
<aside class="site-announcement"
       data-home-announcement
       aria-label="Thông điệp từ Góc Desk">
    <span class="site-announcement-icon" aria-hidden="true">✦</span>
    <p class="site-announcement-message"
       data-announcement-message
       aria-live="off">Một góc nhỏ, nhiều niềm vui · Miễn phí vận chuyển từ 499.000đ</p>
    <button type="button" class="site-announcement-close" aria-label="Đóng thông báo">
        <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18"/>
        </svg>
    </button>
</aside>`;

    const headerMarkup = () => `
<header class="site-header site-shell-header home-site-header">
    <div class="container">
        <div class="header-top">
            <a href="index.html" class="brand-logo" aria-label="Góc Desk — Trang chủ">
                <img class="brand-art"
                     src="images/logo1.png"
                     width="1632"
                     height="964"
                     alt="Góc Desk — Góc nhỏ, cảm hứng lớn">
            </a>

            <form class="search-bar" role="search" action="products.html">
                <input type="search"
                       name="q"
                       placeholder="Tìm bàn phím, đèn bàn, giá đỡ..."
                       aria-label="Tìm kiếm sản phẩm">
                <button type="submit" aria-label="Tìm kiếm">
                    <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="10.5" cy="10.5" r="6.5"/>
                        <path d="m16 16 4.5 4.5"/>
                    </svg>
                </button>
            </form>

            <div class="header-icons">
                <a href="cart.html" class="icon-btn" title="Giỏ hàng" aria-label="Giỏ hàng">
                    <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2 3h3l3 12h11l3-9H6"/>
                        <circle cx="9" cy="20" r="1"/>
                        <circle cx="18" cy="20" r="1"/>
                    </svg>
                </a>
                <a href="account.html" class="icon-btn" title="Tài khoản" aria-label="Tài khoản">
                    <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="7" r="4"/>
                        <path d="M4 21v-2a8 8 0 0 1 16 0v2Z"/>
                    </svg>
                </a>
            </div>
        </div>

        <nav class="main-nav" id="site-primary-nav" aria-label="Menu điều hướng chính">
            <ul class="nav-list">
                <li><a href="index.html">Trang chủ</a></li>
                <li><a href="products.html">Sản phẩm</a></li>
                <li><a href="points.html">Tích điểm</a></li>
                <li><a href="warranty.html">Bảo hành</a></li>
                <li><a href="news.html">Tin tức</a></li>
                <li><a href="setup-3d-cap-nhat.html">Thiết kế 3D</a></li>
            </ul>
        </nav>
    </div>
</header>`;

    const footerMarkup = (backToTopHref) => `
<footer class="site-footer site-shell-footer home-footer" id="site-footer">
    <div class="container">
        <div class="home-footer-grid">

            <div class="home-footer-brand">
                <a class="footer-wordmark" href="index.html" aria-label="Góc Desk — Trang chủ">
                    Góc Desk<span aria-hidden="true">.</span>
                </a>
                <p class="home-footer-tagline">Góc nhỏ, cảm hứng lớn.</p>
                <p>
                    Phụ kiện nhỏ cho góc học tập và làm việc đầy cảm hứng.
                    Chọn vừa nhu cầu, sắp xếp theo cách của bạn.
                </p>
                <a class="home-footer-email" href="mailto:hello@gocdesk.vn">hello@gocdesk.vn</a>
            </div>

            <div class="footer-col">
                <h3>Khám phá</h3>
                <ul>
                    <li><a href="products.html">Tất cả sản phẩm</a></li>
                    <li><a href="index.html#shop-categories">Danh mục sản phẩm</a></li>
                    <li><a href="setup-3d-cap-nhat.html">Thiết kế góc 3D</a></li>
                    <li><a href="news.html">Góc cảm hứng</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h3>Đồng hành cùng bạn</h3>
                <ul>
                    <li><a href="warranty.html">Đổi trả &amp; bảo hành</a></li>
                    <li><a href="warranty.html#warranty-request">Liên hệ hỗ trợ</a></li>
                    <li><a href="index.html#faq">Câu hỏi thường gặp</a></li>
                    <li><a href="points.html">Tích điểm thành viên</a></li>
                </ul>
            </div>

            <div class="home-footer-newsletter">
                <h3>Một chút cảm hứng mỗi tuần</h3>
                <p>
                    Để lại email để nhận thông tin sản phẩm mới
                    và những ý tưởng dành cho góc riêng.
                </p>
                <label class="newsletter-label" for="newsletter-email">Email của bạn</label>
                <div class="newsletter-input">
                    <input id="newsletter-email"
                           type="email"
                           name="email"
                           placeholder="Nhập email của bạn"
                           autocomplete="email"
                           aria-describedby="newsletter-status">
                    <button class="newsletter-submit"
                            type="button"
                            popovertarget="newsletter-info"
                            aria-label="Đăng ký nhận tin">
                        <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 12h15m-6-6 6 6-6 6"/>
                        </svg>
                    </button>
                </div>
                <p class="newsletter-status" id="newsletter-status">Bản tin sẽ sớm được mở đăng ký.</p>
                <p class="home-footer-social">Facebook · Instagram · TikTok</p>
            </div>

        </div>

        <div class="footer-bottom">
            <p>&copy; 2026 Góc Desk. Góc nhỏ, cảm hứng lớn.</p>
            <div class="footer-bottom-links">
                <span>Được chăm chút cho từng góc nhỏ.</span>
                <a href="${backToTopHref}" aria-label="Về đầu trang">
                    Về đầu trang <span aria-hidden="true">↑</span>
                </a>
            </div>
        </div>
    </div>
</footer>

<div class="newsletter-feedback" id="newsletter-info" popover>
    <h3>Cảm ơn bạn đã quan tâm!</h3>
    <p>Đăng ký nhận bản tin sẽ sớm được mở. Email của bạn chưa được gửi hoặc lưu lại.</p>
    <button type="button" popovertarget="newsletter-info" popovertargetaction="hide">Đã hiểu</button>
</div>`;

    /* 2. RENDER — thay slot bằng markup để DOM giống header/footer viết tay
       (header sticky cần nằm trực tiếp trong <body>). */

    function replaceSlot(selector, markup) {
        const slot = document.querySelector(selector);
        if (!slot) return false;

        slot.insertAdjacentHTML("beforebegin", markup);
        slot.remove();
        return true;
    }

    function renderHeader() {
        return replaceSlot("#site-header-slot", headerMarkup());
    }

    /* Popup thông báo: đóng rồi thì không hiện lại trong phiên này.
       Trên điện thoại tự ẩn sau vài giây để không che nút ở đầu trang. */

    const announcementKey = "goc-desk:announcement-closed";
    const autoHideQuery = "(max-width: 640px)";
    const autoHideDelay = 6000;

    function hideAnnouncement(announcement) {
        if (!announcement.isConnected) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            announcement.remove();
            return;
        }

        // Gỡ sau khi hiệu ứng 240ms kết thúc; không dựa vào animationend
        // vì sự kiện này không phát khi trình duyệt tạm dừng hiệu ứng.
        announcement.classList.add("is-leaving");
        window.setTimeout(() => announcement.remove(), 300);
    }

    function renderAnnouncement() {
        if (!document.body.classList.contains("home-page")) return;

        try {
            if (sessionStorage.getItem(announcementKey)) return;
        } catch (_) {
            // Không đọc được storage thì vẫn hiện thông báo.
        }

        document.body.insertAdjacentHTML("beforeend", announcementMarkup);

        const announcement = document.body.lastElementChild;

        announcement.querySelector(".site-announcement-close")
            .addEventListener("click", () => {
                announcement.remove();

                try {
                    sessionStorage.setItem(announcementKey, "1");
                } catch (_) {
                    // Chỉ ẩn trong lần xem này.
                }
            });

        if (window.matchMedia(autoHideQuery).matches) {
            window.setTimeout(() => hideAnnouncement(announcement), autoHideDelay);
        }
    }

    function renderFooter() {
        // Giữ hash của trang (vd. chi tiết sản phẩm) bằng cách trỏ về <main>.
        const mainId = document.querySelector("main")?.id;
        return replaceSlot("#site-footer-slot", footerMarkup(mainId ? `#${mainId}` : "#"));
    }

    /* 3. ACTIVE NAVIGATION */

    // Trang không có mục menu riêng thì làm sáng mục cha.
    const navAliases = {
        "product-detail.html": "products.html",
        "setup-3d.html": "setup-3d-cap-nhat.html"
    };

    function setActiveNavigation() {
        const currentPage =
            window.location.pathname.split("/").pop() || "index.html";
        const navPage = navAliases[currentPage] || currentPage;

        document.querySelectorAll(".site-shell-header .nav-list a[href]").forEach(link => {
            const active = link.getAttribute("href") === navPage;

            link.classList.toggle("active", active);

            if (active) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        document.querySelectorAll(".site-shell-header .icon-btn[href]").forEach(link => {
            if (link.getAttribute("href") === currentPage) {
                link.setAttribute("aria-current", "page");
            }
        });
    }

    /* 4. KHỞI TẠO */

    if (renderHeader()) {
        setActiveNavigation();
    }

    function finish() {
        renderFooter();
        renderAnnouncement();

        // Giữ sự kiện cũ cho js/cart-badge.js, js/home.js...
        document.dispatchEvent(new CustomEvent("site-shell:loaded"));
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", finish, { once: true });
    } else {
        finish();
    }

})();
