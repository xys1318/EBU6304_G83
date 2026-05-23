window.ChatService = (function () {
    const CHAT_MESSAGES_KEY = "chatMessages";
    const CHAT_SELECTED_THREAD_KEY = "chatSelectedThread";

    function getCurrentUser() {
        return {
            username: localStorage.getItem("username") || "",
            role: localStorage.getItem("role") || ""
        };
    }

    function getMessages() {
        return JSON.parse(localStorage.getItem(CHAT_MESSAGES_KEY)) || [];
    }

    function saveMessages(messages) {
        localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(Array.isArray(messages) ? messages : []));
    }

    function isRecipientMatch(msg, user) {
        if (!msg || !user) return false;
        if (msg.toRole !== user.role) return false;
        if (user.role === "mo") {
            return msg.toUser === "*" || msg.toUser === "mo" || !msg.toUser || msg.toUser === user.username;
        }
        if (user.role === "admin") {
            return msg.toUser === "*" || !msg.toUser || msg.toUser === user.username;
        }
        return msg.toUser === "*" || !msg.toUser || msg.toUser === user.username;
    }

    function isInvolved(msg, user) {
        if (!msg || !user) return false;
        if (user.role === "admin") {
            return msg.fromRole === "admin" || isRecipientMatch(msg, user);
        }
        if (user.role === "mo") {
            return msg.fromRole === "mo" || isRecipientMatch(msg, user);
        }
        return String(msg.taUser) === String(user.username) || isRecipientMatch(msg, user);
    }

    function getUnreadCount() {
        const user = getCurrentUser();
        const messages = getMessages();
        return messages.filter((msg) => isRecipientMatch(msg, user) && !msg.read).length;
    }

    function getTopChatThread() {
        const user = getCurrentUser();
        const messages = getMessages();
        const mine = messages.filter((m) => isInvolved(m, user));
        if (!mine.length) return null;
        const last = mine[mine.length - 1];
        return {
            jobId: last.jobId,
            jobTitle: last.jobTitle || ("Job " + last.jobId),
            taUser: last.taUser
        };
    }

    function setSelectedThread(thread) {
        localStorage.setItem(CHAT_SELECTED_THREAD_KEY, JSON.stringify(thread));
    }

    function getSelectedThread() {
        const raw = localStorage.getItem(CHAT_SELECTED_THREAD_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    function clearSelectedThread() {
        localStorage.removeItem(CHAT_SELECTED_THREAD_KEY);
    }

    function threadKey(jobId, taUser) {
        return String(jobId) + "::" + String(taUser);
    }

    function getThreadMessages(jobId, taUser) {
        return getMessages().filter((msg) =>
            String(msg.jobId) === String(jobId) &&
            String(msg.taUser) === String(taUser)
        );
    }

    function markThreadAsRead(jobId, taUser) {
        const user = getCurrentUser();
        const messages = getMessages();
        let changed = false;

        messages.forEach((msg) => {
            const sameThread = String(msg.jobId) === String(jobId) && String(msg.taUser) === String(taUser);
            const forCurrentUser = isRecipientMatch(msg, user);
            if (sameThread && forCurrentUser && !msg.read) {
                msg.read = true;
                changed = true;
            }
        });

        if (changed) saveMessages(messages);
        return changed;
    }

    function buildThreads() {
        const user = getCurrentUser();
        const messages = getMessages();
        const map = {};

        messages.forEach((msg) => {
            const involved = isInvolved(msg, user);
            if (!involved) return;

            const key = threadKey(msg.jobId, msg.taUser);
            if (!map[key]) {
                map[key] = {
                    jobId: msg.jobId,
                    taUser: msg.taUser,
                    jobTitle: msg.jobTitle || ("Job " + msg.jobId),
                    latestTime: msg.time,
                    unread: 0,
                    lastText: msg.text || "",
                    lastFromUser: msg.fromUser || "",
                    lastFromRole: msg.fromRole || "",
                    threadType: msg.threadType || msg.messageType || "",
                    audienceRole: msg.audienceRole || ""
                };
            }
            if (new Date(msg.time) > new Date(map[key].latestTime)) {
                map[key].latestTime = msg.time;
                map[key].jobTitle = msg.jobTitle || map[key].jobTitle;
                map[key].lastText = msg.text || "";
                map[key].lastFromUser = msg.fromUser || "";
                map[key].lastFromRole = msg.fromRole || "";
                map[key].threadType = msg.threadType || msg.messageType || map[key].threadType;
                map[key].audienceRole = msg.audienceRole || map[key].audienceRole;
            }
            const isUnread = isRecipientMatch(msg, user) && !msg.read;
            if (isUnread) {
                map[key].unread += 1;
            }
        });

        const selected = getSelectedThread();
        if (selected) {
            const selectedKey = threadKey(selected.jobId, selected.taUser);
            if (!map[selectedKey]) {
                map[selectedKey] = {
                    jobId: selected.jobId,
                    taUser: selected.taUser,
                    jobTitle: selected.jobTitle || ("Job " + selected.jobId),
                    latestTime: new Date().toISOString(),
                    unread: 0,
                    lastText: "",
                    lastFromUser: "",
                    lastFromRole: "",
                    threadType: "",
                    audienceRole: ""
                };
            }
        }

        return Object.values(map).sort((a, b) => new Date(b.latestTime) - new Date(a.latestTime));
    }

    return {
        getCurrentUser: getCurrentUser,
        getMessages: getMessages,
        saveMessages: saveMessages,
        getUnreadCount: getUnreadCount,
        getTopChatThread: getTopChatThread,
        setSelectedThread: setSelectedThread,
        getSelectedThread: getSelectedThread,
        clearSelectedThread: clearSelectedThread,
        threadKey: threadKey,
        getThreadMessages: getThreadMessages,
        markThreadAsRead: markThreadAsRead,
        buildThreads: buildThreads
    };
})();
