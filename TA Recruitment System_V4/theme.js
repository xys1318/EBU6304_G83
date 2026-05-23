(function () {
    function getRoleTheme() {
        var role = (localStorage.getItem("role") || "").toLowerCase();
        if (role === "mo" || role === "admin" || role === "ta") return role;
        var file = (window.location.pathname.split("/").pop() || "").toLowerCase();
        if (file.indexOf("admin") !== -1) return "admin";
        if (file.indexOf("mo_") !== -1) return "mo";
        return "ta";
    }

    function applyTheme() {
        var theme = getRoleTheme();
        document.documentElement.setAttribute("data-theme", theme);
        document.body && document.body.setAttribute("data-theme", theme);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyTheme);
    } else {
        applyTheme();
    }
})();
