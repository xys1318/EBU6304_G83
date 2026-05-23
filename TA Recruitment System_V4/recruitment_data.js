const RecruitmentData = (function () {
    const BATCH_KEY = "recruitmentBatches";
    const JOBS_KEY = "jobs";
    const APPLICATIONS_KEY = "applications";
    const AUDIT_KEY = "recruitmentAuditLog";

    function nowTs() {
        return Date.now();
    }

    function toTs(value) {
        const ts = new Date(value).getTime();
        return Number.isNaN(ts) ? null : ts;
    }

    function formatDateTime(value) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString();
    }

    function readJSON(key, fallback) {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        try {
            return JSON.parse(raw);
        } catch (error) {
            return fallback;
        }
    }

    function writeJSON(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function getApplications() {
        return readJSON(APPLICATIONS_KEY, []);
    }

    function readAuditLog() {
        return readJSON(AUDIT_KEY, []);
    }

    function appendAuditLog(entry) {
        const list = readAuditLog();
        list.unshift(
            Object.assign(
                {
                    ts: new Date().toISOString()
                },
                entry || {}
            )
        );
        writeJSON(AUDIT_KEY, list.slice(0, 300));
    }

    function parseWorkloadHours(workload) {
        const s = String(workload || "");
        const m = s.match(/(\d+(?:\.\d+)?)/);
        if (!m) return 0;
        const n = Number(m[1]);
        return Number.isFinite(n) ? n : 0;
    }

    function getJobById(jobId) {
        const jobs = refreshJobsCache();
        return jobs.find((j) => String(j.id) === String(jobId)) || null;
    }

    function updateApplicationStatus(jobId, applicantName, newStatus, meta) {
        const applications = getApplications();
        let idx = -1;
        for (let i = 0; i < applications.length; i++) {
            const app = applications[i];
            if (String(app.jobId) === String(jobId) && app.applicantName === applicantName) {
                idx = i;
                break;
            }
        }
        if (idx < 0) {
            return { ok: false, reason: "Application not found." };
        }
        const prev = applications[idx].status;
        applications[idx].status = newStatus;
        const m = meta || {};
        if (m.note) applications[idx].statusNote = m.note;
        if (m.actorRole) applications[idx].lastStatusActorRole = m.actorRole;
        if (m.actorUser) applications[idx].lastStatusActorUser = m.actorUser;
        writeJSON(APPLICATIONS_KEY, applications);
        refreshJobsCache();
        appendAuditLog({
            action: "application_status",
            jobId: String(jobId),
            jobTitle: applications[idx].jobTitle || "",
            applicantName: applicantName,
            fromStatus: prev,
            toStatus: newStatus,
            actorRole: m.actorRole || "",
            actorUser: m.actorUser || ""
        });
        return { ok: true, previousStatus: prev };
    }

    function getBatchStatus(batch) {
        if (batch.isEnded) return "Ended";
        const startTs = toTs(batch.startTime);
        const endTs = toTs(batch.endTime);
        const now = nowTs();

        if (startTs && now < startTs - 1000) return "Not Started";
        if (!endTs || now <= endTs) return "In Progress";
        return "Closed";
    }

    function parseDeadlineToEndISO(deadlineStr) {
        const raw = String(deadlineStr || "").trim();
        if (!raw) {
            return new Date(Date.now() + 86400000 * 90).toISOString();
        }
        const ymd = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (ymd) {
            const end = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]), 23, 59, 59, 999);
            if (!Number.isNaN(end.getTime()) && end.getTime() > Date.now()) {
                return end.toISOString();
            }
        }
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) {
            return d.toISOString();
        }
        return new Date(Date.now() + 86400000 * 90).toISOString();
    }

    function newPositionId(idx) {
        return "position_" + Date.now() + "_" + idx + "_" + Math.random().toString(36).slice(2, 8);
    }

    function migrateFromLegacyJobs() {
        const jobs = readJSON(JOBS_KEY, []);
        if (!jobs.length) return [];

        const batchId = "batch_legacy";
        return [
            {
                id: batchId,
                name: "Legacy Batch",
                semester: "N/A",
                course: "General",
                startTime: new Date(Date.now() - 86400000 * 7).toISOString(),
                endTime: new Date(Date.now() + 86400000 * 30).toISOString(),
                allowCrossCourse: true,
                maxApplicationsPerApplicant: 3,
                mandatoryConditions: "Imported from legacy jobs",
                isEnded: false,
                positions: jobs.map((job) => ({
                    id: "position_" + String(job.id),
                    title: job.title,
                    headcount: 1,
                    workload: job.workload || "-",
                    responsibilities: job.responsibilities || "See job detail",
                    requiredConditions: job.requirements || "-",
                    location: job.location || "BUPT Campus"
                }))
            }
        ];
    }

    function ensureBatches() {
        let batches = readJSON(BATCH_KEY, []);
        if (!batches.length) {
            batches = migrateFromLegacyJobs();
            if (batches.length) {
                writeJSON(BATCH_KEY, batches);
            }
        }
        return batches;
    }

    function getAllBatches() {
        return ensureBatches();
    }

    function toFlatJobs(batches, applications) {
        const list = [];
        batches.forEach((batch) => {
            const batchStatus = getBatchStatus(batch);
            (batch.positions || []).forEach((position, index) => {
                const related = applications.filter((app) => String(app.jobId) === String(position.id) || (String(app.batchId) === String(batch.id) && String(app.positionId) === String(position.id)));
                const activeCount = related.filter((app) => app.status !== "Rejected" && app.status !== "Withdrawn" && app.status !== "Cancelled").length;
                const approvedCount = related.filter((app) => app.status === "Approved").length;
                const waitlistCount = related.filter((app) => app.status === "Waitlisted").length;
                const headcount = Number(position.headcount) > 0 ? Number(position.headcount) : 1;

                let status = "Open";
                if (batchStatus !== "In Progress") {
                    status = batchStatus === "Not Started" ? "Not Started" : "Closed";
                } else if (activeCount >= headcount) {
                    status = "Waitlist Only";
                }

                list.push({
                    id: position.id,
                    legacyId: index + 1,
                    batchId: batch.id,
                    batchName: batch.name,
                    semester: batch.semester,
                    course: batch.course,
                    title: position.title,
                    workload: position.workload || "-",
                    requirements: position.requiredConditions || "-",
                    requirementsDetail: position.requiredConditions || "-",
                    responsibilities: position.responsibilities || "-",
                    content: position.responsibilities || "-",
                    deadline: formatDateTime(batch.endTime),
                    deadlineRaw: batch.endTime,
                    status: status,
                    batchStatus: batchStatus,
                    allowCrossCourse: !!batch.allowCrossCourse,
                    maxApplicationsPerApplicant: Number(batch.maxApplicationsPerApplicant) || 1,
                    mandatoryConditions: batch.mandatoryConditions || "",
                    formFields: Array.isArray(batch.formFields) ? batch.formFields : [],
                    slotsTotal: headcount,
                    slotsUsed: Math.min(activeCount, headcount),
                    approvedCount: approvedCount,
                    waitlistCount: waitlistCount,
                    slotsRemaining: Math.max(0, headcount - activeCount),
                    location: position.location || "BUPT Campus"
                });
            });
        });
        return list;
    }

    function refreshJobsCache() {
        const batches = getAllBatches();
        const jobs = toFlatJobs(batches, getApplications());
        writeJSON(JOBS_KEY, jobs);
        return jobs;
    }

    function validateApplication(job, applicantName, applications) {
        if (job.batchStatus !== "In Progress") {
            return { ok: false, reason: "This recruitment batch is not open for applications (not started / closed / ended)." };
        }

        const samePosition = applications.some((app) =>
            String(app.jobId) === String(job.id) &&
            app.applicantName === applicantName &&
            app.status !== "Rejected" &&
            app.status !== "Cancelled"
        );
        if (samePosition) {
            return { ok: false, reason: "You have already applied for this position." };
        }

        const sameBatch = applications.filter((app) =>
            String(app.batchId) === String(job.batchId) &&
            app.applicantName === applicantName &&
            app.status !== "Rejected" &&
            app.status !== "Cancelled"
        );

        if (sameBatch.length >= job.maxApplicationsPerApplicant) {
            return { ok: false, reason: "You have reached the application limit for this batch." };
        }

        if (!job.allowCrossCourse) {
            const hasOtherCourse = sameBatch.some((app) => app.course && app.course !== job.course);
            if (hasOtherCourse) {
                return { ok: false, reason: "Cross-course applications are not allowed in this batch." };
            }
        }

        return { ok: true };
    }

    function createApplication(job, applicantName, formSubmission) {
        const applications = getApplications();
        const validation = validateApplication(job, applicantName, applications);
        if (!validation.ok) return validation;

        const related = applications.filter((app) =>
            String(app.batchId) === String(job.batchId) &&
            String(app.positionId) === String(job.id) &&
            app.status !== "Rejected" &&
            app.status !== "Cancelled"
        );
        const isWaitlist = related.length >= job.slotsTotal;
        const appStatus = isWaitlist ? "Waitlisted" : "Pending";

        applications.push({
            jobId: job.id,
            positionId: job.id,
            batchId: job.batchId,
            batchName: job.batchName,
            course: job.course,
            jobTitle: job.title,
            applicantName: applicantName,
            date: new Date().toISOString(),
            status: appStatus,
            formSubmission: formSubmission || null
        });
        writeJSON(APPLICATIONS_KEY, applications);
        refreshJobsCache();
        appendAuditLog({
            action: "application_created",
            jobId: String(job.id),
            jobTitle: job.title,
            applicantName: applicantName,
            toStatus: appStatus,
            actorRole: "ta",
            actorUser: applicantName
        });
        return {
            ok: true,
            status: appStatus,
            message: isWaitlist ? "Position is full. You have been added to the waitlist." : "Application submitted successfully."
        };
    }

    function createBatch(payload, meta) {
        const batches = getAllBatches();
        const actor = meta || {};
        const id = "batch_" + Date.now();
        const positions = (payload.positions || []).map((item, idx) => ({
            id: newPositionId(idx),
            title: item.title,
            headcount: Number(item.headcount) || 1,
            workload: item.workload || "-",
            responsibilities: item.responsibilities || "",
            requiredConditions: item.requiredConditions || "",
            location: item.location || "BUPT Campus"
        }));

        batches.unshift({
            id: id,
            name: payload.name,
            semester: payload.semester,
            course: payload.course,
            startTime: payload.startTime,
            endTime: payload.endTime,
            allowCrossCourse: !!payload.allowCrossCourse,
            maxApplicationsPerApplicant: Number(payload.maxApplicationsPerApplicant) || 1,
            mandatoryConditions: payload.mandatoryConditions || "",
            formFields: Array.isArray(payload.formFields) ? payload.formFields : [],
            isEnded: false,
            positions: positions
        });
        writeJSON(BATCH_KEY, batches);
        refreshJobsCache();
        appendAuditLog({
            action: "batch_created",
            batchId: id,
            name: payload.name || "",
            actorRole: actor.actorRole || "admin",
            actorUser: actor.actorUser || ""
        });
        return id;
    }

    function endBatch(batchId, meta) {
        const batches = getAllBatches();
        const target = batches.find((item) => String(item.id) === String(batchId));
        if (!target) return false;
        target.isEnded = true;
        writeJSON(BATCH_KEY, batches);
        refreshJobsCache();
        appendAuditLog({
            action: "batch_ended",
            batchId: String(batchId),
            name: target.name || "",
            actorRole: (meta && meta.actorRole) || "admin",
            actorUser: (meta && meta.actorUser) || ""
        });
        return true;
    }

    function removePositionByJobId(jobId, meta) {
        const batches = readJSON(BATCH_KEY, []);
        if (!batches.length) {
            const jobs = readJSON(JOBS_KEY, []);
            const filtered = jobs.filter((j) => String(j.id) !== String(jobId));
            if (filtered.length === jobs.length) return false;
            writeJSON(JOBS_KEY, filtered);
            return true;
        }
        let changed = false;
        batches.forEach((batch) => {
            const pos = batch.positions || [];
            const idx = pos.findIndex((p) => String(p.id) === String(jobId));
            if (idx >= 0) {
                pos.splice(idx, 1);
                batch.positions = pos;
                changed = true;
            }
        });
        if (!changed) return false;
        writeJSON(BATCH_KEY, batches);
        refreshJobsCache();
        const m = meta || {};
        appendAuditLog({
            action: "position_removed",
            jobId: String(jobId),
            actorRole: m.actorRole || "",
            actorUser: m.actorUser || ""
        });
        return true;
    }

    return {
        getAllBatches: getAllBatches,
        getBatchStatus: getBatchStatus,
        getApplications: getApplications,
        readAuditLog: readAuditLog,
        appendAuditLog: appendAuditLog,
        parseWorkloadHours: parseWorkloadHours,
        getJobById: getJobById,
        updateApplicationStatus: updateApplicationStatus,
        refreshJobsCache: refreshJobsCache,
        createBatch: createBatch,
        endBatch: endBatch,
        removePositionByJobId: removePositionByJobId,
        createApplication: createApplication,
        formatDateTime: formatDateTime,
        parseDeadlineToEndISO: parseDeadlineToEndISO
    };
})();

if (typeof window !== "undefined") {
    window.RecruitmentData = RecruitmentData;
}
