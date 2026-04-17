// Check session
// 检查会话
function checkSession() {
    if (!localStorage.getItem("username")) {
        window.location.href = "login.html";
    }
}

function getJobsData() {
    let jobs = JSON.parse(localStorage.getItem("jobs")) || [];
    
    if (jobs.length === 0) {
        jobs = [
            {
                id: 1,
                title: "EBU6304 Teaching Assistant",
                workload: "5h/week",
                requirements: "Basic Programming",
                deadline: "May 31, 2026",
                status: "Open"
            },
            {
                id: 2,
                title: "EBU6001 Teaching Assistant",
                workload: "3h/week",
                requirements: "Good English",
                deadline: "May 31, 2026",
                status: "Closed"
            },
            {
                id: 3,
                title: "EBU6201 Teaching Assistant",
                workload: "4h/week",
                requirements: "Python Programming",
                deadline: "May 31, 2026",
                status: "Open"
            }
        ];
        localStorage.setItem("jobs", JSON.stringify(jobs));
    }
    return jobs;
}

function renderJobs(jobs) {
    let jobsContainer = document.getElementById("jobsContainer");

    if (jobs.length === 0) {
        jobsContainer.innerHTML = '<div class="no-jobs">No jobs available at the moment.</div>';
        return;
    }

    let jobsHTML = '';
    jobs.forEach((job, index) => {
        let buttonClass = job.status === "Open" ? "btn-primary" : "btn-secondary";
        let buttonText = job.status === "Open" ? "View Details & Apply" : "Position Closed";
        let buttonAction = job.status === "Open" ? `onclick="viewJobDetail(${job.id})"` : `onclick="showClosedJobNotice()"`;
        
        jobsHTML += `
            <div class="job-card">
                <h4>${index + 1}. ${job.title}</h4>
                <div class="job-info">
                    <p><span>Workload:</span> ${job.workload}</p>
                    <p><span>Requirements:</span> ${job.requirements}</p>
                    <p><span>Deadline:</span> ${job.deadline}</p>
                    <p><span>Status:</span> ${job.status}</p>
                </div>
                <div class="job-actions">
                    <button class="${buttonClass}" ${buttonAction}>${buttonText}</button>
                    <button class="btn-secondary" onclick="openConsultChat(${job.id}, '${job.title.replace(/'/g, "\\'")}')">Consult</button>
                </div>
            </div>
        `;
    });
    
    jobsContainer.innerHTML = jobsHTML;
}

// Load jobs
// 加载职位
function loadJobs() {
    let jobs = getJobsData();
    renderJobs(jobs);
}

// Search jobs with fuzzy match
// 职位模糊搜索
function searchJobs() {
    let keyword = document.getElementById("jobSearchInput").value.trim().toLowerCase();
    let jobs = getJobsData();

    if (!keyword) {
        renderJobs(jobs);
        return;
    }

    let filteredJobs = jobs.filter(job => {
        let searchableText = [
            job.title,
            job.requirements,
            job.status,
            job.workload,
            job.deadline
        ].join(" ").toLowerCase();

        return searchableText.includes(keyword);
    });

    renderJobs(filteredJobs);
}

// Reset search and show all jobs
// 重置搜索并显示全部职位
function resetSearch() {
    document.getElementById("jobSearchInput").value = "";
    loadJobs();
}

function showClosedJobNotice() {
    Feedback.showToast("This position is closed.", { variant: "info" });
}

// View job detail
// 查看职位详情
function viewJobDetail(jobId) {
    localStorage.setItem("currentJobId", jobId);
    window.location.href = "job_detail.html?id=" + encodeURIComponent(jobId);
}

function goPersonalCenter() {
    window.location.href = "personal_center.html";
}

function getChatMessages() {
    return JSON.parse(localStorage.getItem("chatMessages")) || [];
}

function saveChatMessages(messages) {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
}

function getUnreadCount() {
    let role = localStorage.getItem("role");
    let username = localStorage.getItem("username");
    let messages = getChatMessages();
    return messages.filter(msg => msg.toRole === role && msg.toUser === username && !msg.read).length;
}

function refreshUnreadBadge() {
    let badge = document.getElementById("chatUnreadBadge");
    let count = getUnreadCount();
    if (count > 0) {
        badge.style.display = "inline-block";
        badge.textContent = count > 99 ? "99+" : String(count);
    } else {
        badge.style.display = "none";
        badge.textContent = "";
    }
}

let activeChat = { jobId: null, jobTitle: "", taUser: null };

function openConsultChat(jobId, jobTitle) {
    let username = localStorage.getItem("username");
    activeChat = { jobId: jobId, jobTitle: jobTitle, taUser: username };
    localStorage.setItem("chatSelectedThread", JSON.stringify(activeChat));
    window.location.href = "chat_list.html";
}

function openTopChat() {
    let username = localStorage.getItem("username");
    let messages = getChatMessages();
    let mine = messages.filter(m => m.taUser === username);
    if (mine.length === 0) {
        localStorage.removeItem("chatSelectedThread");
        window.location.href = "chat_list.html";
        return;
    }
    let last = mine[mine.length - 1];
    activeChat = { jobId: last.jobId, jobTitle: last.jobTitle, taUser: username };
    localStorage.setItem("chatSelectedThread", JSON.stringify(activeChat));
    window.location.href = "chat_list.html";
}

function openChatModal() {
    document.getElementById("chatModalMask").style.display = "flex";
    document.getElementById("chatMeta").textContent = "Job: " + activeChat.jobTitle + " | TA: " + activeChat.taUser;
    renderChatMessages();
    markThreadAsRead();
}

function closeChatModal() {
    document.getElementById("chatModalMask").style.display = "none";
    refreshUnreadBadge();
}

function getCurrentThreadMessages() {
    let messages = getChatMessages();
    return messages.filter(msg =>
        String(msg.jobId) === String(activeChat.jobId) &&
        msg.taUser === activeChat.taUser
    );
}

function renderChatMessages() {
    let role = localStorage.getItem("role");
    let username = localStorage.getItem("username");
    let thread = getCurrentThreadMessages();
    let box = document.getElementById("chatMessages");

    if (thread.length === 0) {
        box.innerHTML = "<div class='chat-item'>No messages yet. Start consulting.</div>";
        return;
    }

    let html = "";
    thread.forEach(msg => {
        let mine = msg.fromRole === role && msg.fromUser === username;
        let cls = mine ? "chat-item mine" : "chat-item";
        let time = new Date(msg.time).toLocaleString();
        html += `<div class="${cls}"><strong>${msg.fromUser}</strong> (${time}): ${msg.text}</div>`;
    });
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
}

function markThreadAsRead() {
    let role = localStorage.getItem("role");
    let username = localStorage.getItem("username");
    let messages = getChatMessages();
    let changed = false;

    messages.forEach(msg => {
        if (
            String(msg.jobId) === String(activeChat.jobId) &&
            msg.taUser === activeChat.taUser &&
            msg.toRole === role &&
            msg.toUser === username &&
            !msg.read
        ) {
            msg.read = true;
            changed = true;
        }
    });

    if (changed) {
        saveChatMessages(messages);
    }
    refreshUnreadBadge();
}

function sendChatMessage() {
    let role = localStorage.getItem("role");
    let username = localStorage.getItem("username");
    let input = document.getElementById("chatInput");
    let text = input.value.trim();
    if (!text) return;

    let messages = getChatMessages();
    messages.push({
        jobId: activeChat.jobId,
        jobTitle: activeChat.jobTitle,
        taUser: activeChat.taUser,
        fromRole: role,
        fromUser: username,
        toRole: "mo",
        toUser: "mo",
        text: text,
        time: new Date().toISOString(),
        read: false
    });
    saveChatMessages(messages);
    input.value = "";
    renderChatMessages();
    refreshUnreadBadge();
}

// Logout
// 登出
function logout() {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "login.html";
}

// Check session and load jobs on page load
// 页面加载时检查会话和加载职位
window.onload = function() {
    checkSession();
    loadJobs();
    document.getElementById("jobSearchInput").addEventListener("input", searchJobs);
    refreshUnreadBadge();
};
