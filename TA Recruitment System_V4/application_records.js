// Check session
// 检查会话
function checkSession() {
    if (!localStorage.getItem("username")) {
        window.location.href = "login.html";
    }
}

// Load application records
// 加载申请记录
function loadApplicationRecords() {
    let applications = JSON.parse(localStorage.getItem("applications")) || [];
    let username = localStorage.getItem("username");
    let recordsContainer = document.getElementById("recordsContainer");
    
    // Filter applications for current user
    // 筛选当前用户的申请
    let userApplications = applications.filter(app => app.applicantName === username);
    
    if (userApplications.length === 0) {
        recordsContainer.innerHTML = '<div class="no-records">No application records found.</div>';
        return;
    }
    
    // Generate record cards
    // 生成记录卡片
    let recordsHTML = '';
    userApplications.forEach((app, index) => {
        let statusClass = '';
        switch (app.status) {
            case 'Pending':
                statusClass = 'status-pending';
                break;
            case 'Approved':
                statusClass = 'status-approved';
                break;
            case 'Rejected':
                statusClass = 'status-rejected';
                break;
            case 'Waitlisted':
                statusClass = 'status-waitlisted';
                break;
        }
        
        let date = new Date(app.date).toLocaleDateString();
        
        recordsHTML += `
            <div class="record-card">
                <h4>${index + 1}. ${app.jobTitle}</h4>
                <div class="record-info"><span>Application Date:</span> ${date}</div>
                <div class="record-info"><span>Status:</span> <span class="status ${statusClass}">${app.status}</span></div>
            </div>
        `;
    });
    
    recordsContainer.innerHTML = recordsHTML;
}

// Logout
// 登出
function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}

function goPersonalCenter() {
    window.location.href = "personal_center.html";
}

// Check session and load records on page load
// 页面加载时检查会话和加载记录
window.onload = function() {
    checkSession();
    loadApplicationRecords();
};
// Check session
// 检查会话
function checkSession() {
    if (!localStorage.getItem("username") || !RoleAccess.requireAnyRole(["applicant"], "login.html")) {
        window.location.href = "login.html";
    }
}

// Load application records
// 加载申请记录
function loadApplicationRecords() {
    let applications = JSON.parse(localStorage.getItem("applications")) || [];
    let username = localStorage.getItem("username");
    let recordsContainer = document.getElementById("recordsContainer");
    
    // Filter applications for current user
    // 筛选当前用户的申请
    let userApplications = applications.filter(app => app.applicantName === username);
    
    if (userApplications.length === 0) {
        recordsContainer.innerHTML = '<div class="no-records">No application records found.</div>';
        return;
    }
    
    // Generate record cards
    // 生成记录卡片
    let recordsHTML = '';
    userApplications.forEach((app, index) => {
        let statusClass = '';
        switch (app.status) {
            case 'Pending':
                statusClass = 'status-pending';
                break;
            case 'Approved':
                statusClass = 'status-approved';
                break;
            case 'Rejected':
                statusClass = 'status-rejected';
                break;
            case 'Waitlisted':
                statusClass = 'status-waitlisted';
                break;
        }
        
        let date = new Date(app.date).toLocaleDateString();
        
        recordsHTML += `
            <div class="record-card">
                <h4>${index + 1}. ${app.jobTitle}</h4>
                <div class="record-info"><span class="tag">课程 ${app.course || "-"}</span><span class="tag">岗位 ${app.jobTitle || "-"}</span></div>
                <div class="record-info"><span>Application Date:</span> ${date}</div>
                <div class="record-info"><span>Status:</span> <span class="status ${statusClass}">${app.status}</span></div>
            </div>
        `;
    });
    
    recordsContainer.innerHTML = recordsHTML;
}

// Logout
// 登出
function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}

function goPersonalCenter() {
    window.location.href = "personal_center.html";
}

function switchTab(tabId, el) {
    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
    el.classList.add("active");
}

function loadProgressTimeline() {
    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    const username = localStorage.getItem("username");
    const box = document.getElementById("progressTimelineContainer");
    const userApplications = applications.filter(app => app.applicantName === username).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!userApplications.length) {
        box.innerHTML = '<div class="no-records">暂无进度时间线。</div>';
        return;
    }
    box.innerHTML = userApplications.map((app) => {
        return `<div class="record-card">
            <div class="record-info"><span>课程/岗位:</span> ${app.course || "-"} / ${app.jobTitle || "-"}</div>
            <div class="record-info"><span>状态:</span> ${app.status}</div>
            <div class="record-info"><span>时间:</span> ${new Date(app.date).toLocaleString()}</div>
        </div>`;
    }).join("");
}

function loadHistoryNotifications() {
    const applications = JSON.parse(localStorage.getItem("applications")) || [];
    const username = localStorage.getItem("username");
    const box = document.getElementById("historyNotificationsContainer");
    const list = applications.filter(app => app.applicantName === username && app.status && app.status !== "Pending");
    if (!list.length) {
        box.innerHTML = '<div class="no-records">暂无历史通知。</div>';
        return;
    }
    box.innerHTML = list.map((app) => {
        return `<div class="record-card">
            <div class="record-info"><span>通知:</span> 你的申请状态已更新为 <strong>${app.status}</strong></div>
            <div class="record-info"><span>课程/岗位:</span> ${app.course || "-"} / ${app.jobTitle || "-"}</div>
            <div class="record-info"><span>时间:</span> ${new Date(app.date).toLocaleString()}</div>
        </div>`;
    }).join("");
}

// Check session and load records on page load
// 页面加载时检查会话和加载记录
window.onload = function() {
    checkSession();
    document.getElementById("roleBadge").textContent = "当前角色: " + RoleAccess.getRoleLabel();
    loadApplicationRecords();
    loadProgressTimeline();
    loadHistoryNotifications();
    RoleAccess.mountOperationTimeline("operationTimelineContainer");
};
