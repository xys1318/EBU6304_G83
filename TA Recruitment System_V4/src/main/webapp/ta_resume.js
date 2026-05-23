/**
 * TA resume stored per student ID: cvData_<id> (data URL), cvMeta_<id> (JSON).
 * Preview is shown in a lightweight modal (PDF/image), no forced download.
 */
window.TaResume = (function () {
    const MODAL_ID = "taResumePreviewModal";
    let activeEscHandler = null;

    function cvDataKey(studentId) {
        return "cvData_" + String(studentId || "guest");
    }

    function cvMetaKey(studentId) {
        return "cvMeta_" + String(studentId || "guest");
    }

    function readMeta(studentId) {
        try {
            return JSON.parse(localStorage.getItem(cvMetaKey(studentId)) || "null");
        } catch (e) {
            return null;
        }
    }

    function getDataUrl(studentId) {
        const raw = localStorage.getItem(cvDataKey(studentId));
        if (!raw || String(raw).length < 12) return null;
        return raw;
    }

    function hasResume(studentId) {
        return !!getDataUrl(studentId);
    }

    /**
     * Map application list "applicantName" (usually student ID) to the localStorage key
     * used for cvData_*. If the value is a full name from legacy data, match users[].
     */
    function resolveResumeOwnerId(applicantLabel) {
        const raw = String(applicantLabel || "").trim();
        if (!raw) return "";
        if (getDataUrl(raw)) return raw;

        let users = [];
        try {
            users = JSON.parse(localStorage.getItem("users") || "[]");
        } catch (e) {
            users = [];
        }
        if (!Array.isArray(users)) return raw;

        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            if (!u) continue;
            const sid = String(u.studentId || "").trim();
            const fn = String(u.fullName || "").trim();
            if (fn && fn === raw && sid && getDataUrl(sid)) {
                return sid;
            }
        }
        return raw;
    }

    function dataUrlKind(dataUrl) {
        const raw = String(dataUrl || "").toLowerCase();
        if (raw.indexOf("data:application/pdf") === 0) return "pdf";
        if (raw.indexOf("data:image/") === 0) return "image";
        return "other";
    }

    function triggerDownload(dataUrl, downloadName) {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = downloadName || "resume";
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function escapeHtml(text) {
        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function closeResumePreview() {
        const old = document.getElementById(MODAL_ID);
        if (old) old.remove();
        if (activeEscHandler) {
            document.removeEventListener("keydown", activeEscHandler);
            activeEscHandler = null;
        }
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function openResumePreview(dataUrl, fileName, kind) {
        closeResumePreview();
        const mask = document.createElement("div");
        mask.id = MODAL_ID;
        mask.style.cssText = [
            "position:fixed",
            "inset:0",
            "background:rgba(0,0,0,0.5)",
            "display:flex",
            "align-items:center",
            "justify-content:center",
            "z-index:5000"
        ].join(";");

        const safeFileName = escapeHtml(fileName || "Resume");
        const contentHtml = kind === "pdf"
            ? "<iframe src=\"" + dataUrl + "\" style=\"width:100%;height:100%;border:none;background:#fff;\"></iframe>"
            : "<div id=\"taResumeImageViewport\" style=\"width:100%;height:100%;overflow:auto;display:flex;align-items:center;justify-content:center;cursor:zoom-in;\">" +
                "<img id=\"taResumePreviewImage\" src=\"" + dataUrl + "\" alt=\"" + safeFileName + "\" style=\"max-width:100%;max-height:100%;object-fit:contain;background:#fff;display:block;margin:auto;transform-origin:center center;\"/>" +
              "</div>";

        mask.innerHTML =
            "<div style=\"width:min(920px,92vw);height:min(760px,86vh);background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.28);display:flex;flex-direction:column;\">" +
                "<div style=\"height:52px;padding:0 14px;display:flex;align-items:center;justify-content:space-between;background:#003366;color:#fff;\">" +
                    "<strong style=\"font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:78%;\">" + safeFileName + "</strong>" +
                    "<div style=\"display:flex;gap:8px;\">" +
                        "<button type=\"button\" id=\"taResumeDownloadBtn\" style=\"border:none;border-radius:6px;padding:6px 10px;cursor:pointer;background:#e8eefc;color:#0e326d;font-weight:600;\">Download</button>" +
                        "<button type=\"button\" id=\"taResumeCloseBtn\" style=\"border:none;border-radius:6px;padding:6px 10px;cursor:pointer;background:#fff;color:#003366;font-weight:700;\">Close</button>" +
                    "</div>" +
                "</div>" +
                "<div style=\"flex:1;padding:10px;background:#f7f8fb;\">" + contentHtml + "</div>" +
            "</div>";

        document.body.appendChild(mask);
        const closeBtn = document.getElementById("taResumeCloseBtn");
        const downloadBtn = document.getElementById("taResumeDownloadBtn");
        if (closeBtn) closeBtn.onclick = closeResumePreview;
        if (downloadBtn) downloadBtn.onclick = function () { triggerDownload(dataUrl, fileName); };
        mask.addEventListener("click", function (event) {
            if (event.target === mask) closeResumePreview();
        });

        activeEscHandler = function (event) {
            if (event.key === "Escape") {
                event.preventDefault();
                closeResumePreview();
            }
        };
        document.addEventListener("keydown", activeEscHandler);

        if (kind === "image") {
            const viewport = document.getElementById("taResumeImageViewport");
            const image = document.getElementById("taResumePreviewImage");
            if (viewport && image) {
                let scale = 1;
                viewport.addEventListener("wheel", function (event) {
                    event.preventDefault();
                    const step = event.deltaY < 0 ? 0.1 : -0.1;
                    scale = clamp(scale + step, 0.3, 4);
                    image.style.transform = "scale(" + scale.toFixed(2) + ")";
                }, { passive: false });
            }
        }
    }

    /**
     * Open resume in modal preview when supported; fallback to download only when necessary.
     * @returns {{ ok: boolean, reason?: string, message?: string }}
     */
    function openResume(studentId) {
        const dataUrl = getDataUrl(studentId);
        if (!dataUrl) {
            return { ok: false, reason: "missing", message: "No resume on file." };
        }
        const meta = readMeta(studentId);
        const fileName = (meta && meta.fileName) || "resume";
        const kind = dataUrlKind(dataUrl);

        if (kind === "other") {
            triggerDownload(dataUrl, fileName);
            return { ok: true, message: "Preview not supported for this file type. Download started." };
        }

        openResumePreview(dataUrl, fileName, kind);
        return { ok: true };
    }

    return {
        cvDataKey: cvDataKey,
        cvMetaKey: cvMetaKey,
        readMeta: readMeta,
        hasResume: hasResume,
        getDataUrl: getDataUrl,
        resolveResumeOwnerId: resolveResumeOwnerId,
        openResume: openResume,
        closeResumePreview: closeResumePreview
    };
})();
