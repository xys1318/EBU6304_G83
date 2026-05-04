window.RoleAccess = (function () {
    const ROLE_PERMISSIONS = {
        ta: [
            "ta_my_applications",
            "ta_progress_timeline",
            "ta_history_notifications",
            "view_operation_timeline",
            "apply_job"
        ],
        mo: [
            "mo_approval_console",
            "mo_hiring_decision_entry",
            "view_operation_timeline"
        ],
        admin: [
            "admin_position_config_page",
            "admin_template_page",
            "admin_role_management_page",
            "admin_export_center",
            "view_operation_timeline"
        ]
    };

    function getCurrentRole() {
        return localStorage.getItem("role") || "";
    }

    function can(permission) {
        const role = getCurrentRole();
        const permissions = ROLE_PERMISSIONS[role] || [];
        return permissions.includes(permission);
    }

    function getRoleLabel() {
        const role = getCurrentRole();
        if (role === "ta") return "TA";
        if (role === "mo") return "MO";
        if (role === "admin") return "Admin";
        return "Unknown";
    }

    function requireRole(roles) {
        const role = getCurrentRole();
        return roles.includes(role);
    }

    function hasSession() {
        return !!localStorage.getItem("username");
    }

    function requireAnyRole(roles, redirectUrl) {
        const ok = hasSession() && requireRole(roles || []);
        if (!ok && redirectUrl) {
            window.location.href = redirectUrl;
        }
        return ok;
    }

    function guardPage(options) {
        const config = options || {};
        const roles = Array.isArray(config.roles) ? config.roles : [];
        const redirectUrl = config.redirectUrl || "login.html";
        return requireAnyRole(roles, redirectUrl);
    }

    function getLandingPage(role) {
        if (role === "ta") return "profile.html";
        if (role === "mo") return "mo_dashboard.html";
        return "admin_dashboard.html";
    }

    function guardPermissionButtons() {
        const buttons = document.querySelectorAll("[data-permission]");
        buttons.forEach((button) => {
            const permission = button.getAttribute("data-permission");
            if (can(permission)) return;
            button.disabled = true;
            button.style.opacity = "0.55";
            button.style.cursor = "not-allowed";
            button.title = "Current role has no permission";
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (window.Feedback) {
                    Feedback.showToast("Current role has no permission", { variant: "info" });
                }
            });
        });
    }

    function guardRoleButtons() {
        const role = getCurrentRole();
        const buttons = document.querySelectorAll("[data-roles]");
        buttons.forEach((button) => {
            const raw = button.getAttribute("data-roles") || "";
            const roles = raw.split(",").map((item) => item.trim()).filter(Boolean);
            if (!roles.length || roles.includes(role)) return;
            button.disabled = true;
            button.style.opacity = "0.55";
            button.style.cursor = "not-allowed";
            button.title = "Current role has no permission";
            button.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (window.Feedback) {
                    Feedback.showToast("Current role has no permission", { variant: "info" });
                }
            });
        });
    }

    function applyRouteGuards() {
        const role = getCurrentRole();
        const links = document.querySelectorAll("[data-route-roles][data-route-target]");
        links.forEach((el) => {
            const raw = el.getAttribute("data-route-roles") || "";
            const roles = raw.split(",").map((item) => item.trim()).filter(Boolean);
            if (!roles.length || roles.includes(role)) return;
            el.addEventListener("click", function (event) {
                event.preventDefault();
                event.stopPropagation();
                if (window.Feedback) {
                    Feedback.showToast("Current role has no permission", { variant: "info" });
                }
            });
        });
    }

    function guardButtons() {
        guardPermissionButtons();
        guardRoleButtons();
        applyRouteGuards();
    }

    function hideForbiddenModules() {
        const modules = document.querySelectorAll("[data-module-permission]");
        modules.forEach((module) => {
            const permission = module.getAttribute("data-module-permission");
            if (!can(permission)) {
                module.style.display = "none";
            }
        });
    }

    function mountOperationTimeline(containerId) {
        const box = document.getElementById(containerId);
        if (!box) return;
        const applications = JSON.parse(localStorage.getItem("applications")) || [];
        if (!applications.length) {
            box.innerHTML = '<div style="padding:12px 0;color:#666;">No operation records.</div>';
            return;
        }
        const sorted = applications.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        box.innerHTML = sorted.slice(0, 40).map((app) => {
            return (
                '<div style="padding:10px 0;border-bottom:1px solid #eee;">' +
                '<div><strong>[' + (app.course || "-") + "]</strong> [" + (app.jobTitle || "-") + "] " + (app.status || "-") + "</div>" +
                '<div style="font-size:12px;color:#666;">Applicant: ' + (app.applicantName || "-") + " | Time: " + (app.date ? new Date(app.date).toLocaleString() : "-") + "</div>" +
                "</div>"
            );
        }).join("");
    }

    return {
        can: can,
        getCurrentRole: getCurrentRole,
        getRoleLabel: getRoleLabel,
        requireRole: requireRole,
        hasSession: hasSession,
        requireAnyRole: requireAnyRole,
        guardPage: guardPage,
        getLandingPage: getLandingPage,
        guardPermissionButtons: guardPermissionButtons,
        guardRoleButtons: guardRoleButtons,
        applyRouteGuards: applyRouteGuards,
        guardButtons: guardButtons,
        hideForbiddenModules: hideForbiddenModules,
        mountOperationTimeline: mountOperationTimeline
    };
})();
