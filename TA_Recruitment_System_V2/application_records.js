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
