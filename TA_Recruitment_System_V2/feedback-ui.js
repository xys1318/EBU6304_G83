/**
 * In-page feedback: toasts, top banner, button loading (no window.alert).
 * Load before inline scripts that call Feedback.*.
 */
(function () {
    var STYLE_ID = "feedback-ui-styles";
    var TOAST_HOST_ID = "feedback-toast-host";
    var BANNER_ID = "feedback-banner";

    var css =
        "#" + TOAST_HOST_ID + "{position:fixed;right:20px;bottom:20px;z-index:100002;display:flex;flex-direction:column;gap:10px;align-items:flex-end;pointer-events:none;max-width:min(420px,calc(100vw - 40px));}" +
        ".feedback-toast{pointer-events:auto;background:#1a1a1a;color:#fff;padding:12px 16px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.2);font:14px/1.4 Arial,Helvetica,sans-serif;animation:feedback-toast-in .25s ease;}" +
        ".feedback-toast.success{background:#0d5c2e;}" +
        ".feedback-toast.error{background:#8b1a1a;}" +
        ".feedback-toast.info{background:#003366;}" +
        "@keyframes feedback-toast-in{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}" +
        "#" + BANNER_ID + "{display:none;position:fixed;top:0;left:0;right:0;z-index:100001;padding:12px 48px 12px 16px;font:14px/1.45 Arial,Helvetica,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.15);}" +
        "#" + BANNER_ID + ".visible{display:block;}" +
        "#" + BANNER_ID + ".success{background:#d4edda;color:#155724;border-bottom:1px solid #c3e6cb;}" +
        "#" + BANNER_ID + ".error{background:#f8d7da;color:#721c24;border-bottom:1px solid #f5c6cb;}" +
        "#" + BANNER_ID + ".info{background:#cce5ff;color:#004085;border-bottom:1px solid #b8daff;}" +
        "#" + BANNER_ID + " .feedback-banner-inner{white-space:pre-wrap;word-break:break-word;}" +
        "#" + BANNER_ID + " .feedback-banner-close{position:absolute;top:10px;right:12px;border:none;background:transparent;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px;opacity:.7;}" +
        "#" + BANNER_ID + " .feedback-banner-close:hover{opacity:1;}" +
        ".feedback-btn-loading{position:relative;opacity:.92;cursor:wait !important;}" +
        ".feedback-btn-loading .feedback-spinner{display:inline-block;width:14px;height:14px;margin-right:8px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;vertical-align:-2px;animation:feedback-spin .7s linear infinite;}" +
        ".feedback-btn-loading.feedback-btn-secondary .feedback-spinner,.feedback-btn-loading.btn-secondary .feedback-spinner{border-color:rgba(0,0,0,.2);border-top-color:#333;}" +
        "@keyframes feedback-spin{to{transform:rotate(360deg);}}";

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        var s = document.createElement("style");
        s.id = STYLE_ID;
        s.textContent = css;
        document.head.appendChild(s);
    }

    function toastHost() {
        var el = document.getElementById(TOAST_HOST_ID);
        if (!el) {
            el = document.createElement("div");
            el.id = TOAST_HOST_ID;
            el.setAttribute("aria-live", "polite");
            document.body.appendChild(el);
        }
        return el;
    }

    function bannerEl() {
        var el = document.getElementById(BANNER_ID);
        if (!el) {
            el = document.createElement("div");
            el.id = BANNER_ID;
            el.setAttribute("role", "status");
            el.innerHTML =
                '<button type="button" class="feedback-banner-close" aria-label="Dismiss">&times;</button>' +
                '<div class="feedback-banner-inner"></div>';
            el.querySelector(".feedback-banner-close").onclick = function () {
                hideBanner();
            };
            document.body.appendChild(el);
        }
        return el;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    var bannerTimer = null;

    function hideBanner() {
        var el = document.getElementById(BANNER_ID);
        if (!el) return;
        el.classList.remove("visible", "success", "error", "info");
        if (bannerTimer) {
            clearTimeout(bannerTimer);
            bannerTimer = null;
        }
    }

    function showBanner(message, opts) {
        opts = opts || {};
        var variant = opts.variant || "info";
        var duration = opts.duration != null ? opts.duration : 8000;
        var multiline = !!opts.multiline;
        injectStyles();
        var el = bannerEl();
        var inner = el.querySelector(".feedback-banner-inner");
        inner.textContent = message;
        inner.style.whiteSpace = multiline ? "pre-wrap" : "normal";
        el.classList.remove("success", "error", "info");
        el.classList.add("visible", variant);
        if (bannerTimer) clearTimeout(bannerTimer);
        if (duration > 0) {
            bannerTimer = setTimeout(hideBanner, duration);
        }
    }

    function showToast(message, opts) {
        opts = opts || {};
        var variant = opts.variant || "info";
        var duration = opts.duration != null ? opts.duration : 3200;
        injectStyles();
        var host = toastHost();
        var t = document.createElement("div");
        t.className = "feedback-toast " + variant;
        t.textContent = message;
        host.appendChild(t);
        setTimeout(function () {
            if (t.parentNode) t.parentNode.removeChild(t);
        }, duration);
    }

    function setButtonLoading(button, loading, opts) {
        opts = opts || {};
        if (typeof button === "string") button = document.querySelector(button);
        if (!button || !button.tagName || button.tagName.toLowerCase() !== "button") return;

        if (loading) {
            if (button.getAttribute("data-feedback-busy") === "1") return;
            button.setAttribute("data-feedback-busy", "1");
            button.setAttribute("data-feedback-prev-disabled", button.disabled ? "1" : "0");
            button.setAttribute("data-feedback-html", button.innerHTML);
            button.disabled = true;
            button.classList.add("feedback-btn-loading");
            var label = opts.label != null ? opts.label : "Please wait…";
            button.innerHTML =
                '<span class="feedback-spinner" aria-hidden="true"></span><span>' + escapeHtml(label) + "</span>";
        } else {
            if (button.getAttribute("data-feedback-busy") !== "1") return;
            var prev = button.getAttribute("data-feedback-html");
            if (prev != null) button.innerHTML = prev;
            button.removeAttribute("data-feedback-html");
            button.disabled = button.getAttribute("data-feedback-prev-disabled") === "1";
            button.removeAttribute("data-feedback-prev-disabled");
            button.removeAttribute("data-feedback-busy");
            button.classList.remove("feedback-btn-loading");
        }
    }

    injectStyles();

    window.Feedback = {
        showToast: showToast,
        showBanner: showBanner,
        hideBanner: hideBanner,
        setButtonLoading: setButtonLoading
    };
})();
