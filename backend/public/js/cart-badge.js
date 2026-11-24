(function (cart) {
    "use strict";

    const selector = '.site-shell-header a.icon-btn[href="cart.html"]';

    function getLinks() {
        return document.querySelectorAll(selector);
    }

    function init() {
        getLinks().forEach(link => {
            if (link.querySelector(".cart-count")) return;

            const badge = document.createElement("span");
            badge.className = "cart-count";
            badge.setAttribute("aria-hidden", "true");
            badge.hidden = true;

            link.appendChild(badge);
        });

        refresh();
    }

    function refresh() {
        let quantity = 0;

        try {
            quantity = cart?.summary?.().quantity || 0;
        } catch (_) {
            // Không hiển thị số lượng chưa được lưu.
        }

        getLinks().forEach(link => {
            const badge = link.querySelector(".cart-count");
            if (!badge) return;

            badge.textContent = quantity > 99 ? "99+" : String(quantity);
            badge.hidden = quantity === 0;

            link.setAttribute(
                "aria-label",
                quantity ? `Giỏ hàng, ${quantity} sản phẩm` : "Giỏ hàng"
            );
        });
    }

    // Header/footer được tải xong.
    document.addEventListener("site-shell:loaded", init);

    // Hỗ trợ các trang chưa dùng component chung.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }

    cart?.subscribe?.(refresh);

    window.addEventListener("pageshow", refresh);

})(globalThis.GocDeskCart);