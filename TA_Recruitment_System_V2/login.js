// Login function with role-based authentication
// 登录验证函数，支持基于角色的认证
function login() {
    let user = document.getElementById("username").value;
    let password = document.getElementById("pwd").value;
    let role = document.querySelector('input[name="role"]:checked').value;
    let loginBtn = document.getElementById("loginSubmitBtn");
    
    // Check registered users first
    // 首先检查注册用户
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let registeredUser = users.find(u => u.studentId === user && u.password === password && u.role === role);
    
    let isValid = false;
    let redirectUrl = "";
    
    if (registeredUser) {
        // Registered user found
        // 找到注册用户
        isValid = true;
        redirectUrl = role === "ta" ? "personal_center.html" : role === "mo" ? "mo_dashboard.html" : "admin_dashboard.html";
    } else if (role === "ta" && user === "ta" && password === "123456") {
        // Default TA account
        // 默认TA账号
        isValid = true;
        redirectUrl = "personal_center.html";
    } else if (role === "mo" && user === "mo" && password === "654321") {
        // Default MO account
        // 默认MO账号
        isValid = true;
        redirectUrl = "mo_dashboard.html";
    } else if (role === "admin" && user === "admin" && password === "admin123") {
        // Default Admin account
        // 默认Admin账号
        isValid = true;
        redirectUrl = "admin_dashboard.html";
    }
    
    if (isValid) {
        localStorage.setItem("username", user);
        localStorage.setItem("role", role);
        Feedback.setButtonLoading(loginBtn, true, { label: "Signing in…" });
        Feedback.showToast("Login successful. Redirecting…", { variant: "success", duration: 1400 });
        setTimeout(function () {
            window.location.href = redirectUrl;
        }, 650);
    } else {
        Feedback.showToast("Login failed. Please check your credentials.", { variant: "error" });
    }
}
