const RecruitmentData = (function () {
    const BATCH_KEY = "recruitmentBatches";
    const JOBS_KEY = "jobs";
    const APPLICATIONS_KEY = "applications";

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

    function getBatchStatus(batch) {
        if (batch.isEnded) return "已结束";
        const startTs = toTs(batch.startTime);
        const endTs = toTs(batch.endTime);
        const now = nowTs();

        if (startTs && now < startTs) return "未开始";
        if (endTs && now <= endTs) return "进行中";
        return "已截止";
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
                if (batchStatus !== "进行中") {
                    status = batchStatus === "未开始" ? "Not Started" : "Closed";
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
        if (job.batchStatus !== "进行中") {
            return { ok: false, reason: "该招聘批次当前不可申请（未开始/已截止/已结束）。" };
        }

        const samePosition = applications.some((app) =>
            String(app.jobId) === String(job.id) &&
            app.applicantName === applicantName &&
            app.status !== "Rejected" &&
            app.status !== "Cancelled"
        );
        if (samePosition) {
            return { ok: false, reason: "你已申请过该岗位。" };
        }

        const sameBatch = applications.filter((app) =>
            String(app.batchId) === String(job.batchId) &&
            app.applicantName === applicantName &&
            app.status !== "Rejected" &&
            app.status !== "Cancelled"
        );

        if (sameBatch.length >= job.maxApplicationsPerApplicant) {
            return { ok: false, reason: "已达到该批次可申请岗位上限。" };
        }

        if (!job.allowCrossCourse) {
            const hasOtherCourse = sameBatch.some((app) => app.course && app.course !== job.course);
            if (hasOtherCourse) {
                return { ok: false, reason: "该批次不允许跨课程申请。" };
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
        return {
            ok: true,
            status: appStatus,
            message: isWaitlist ? "岗位已满，已进入候补名单。" : "申请提交成功。"
        };
    }

    function createBatch(payload) {
        const batches = getAllBatches();
        const id = "batch_" + Date.now();
        const positions = (payload.positions || []).map((item, idx) => ({
            id: "position_" + Date.now() + "_" + idx,
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
        return id;
    }

    function endBatch(batchId) {
        const batches = getAllBatches();
        const target = batches.find((item) => String(item.id) === String(batchId));
        if (!target) return false;
        target.isEnded = true;
        writeJSON(BATCH_KEY, batches);
        refreshJobsCache();
        return true;
    }

    return {
        getAllBatches: getAllBatches,
        getBatchStatus: getBatchStatus,
        refreshJobsCache: refreshJobsCache,
        createBatch: createBatch,
        endBatch: endBatch,
        createApplication: createApplication,
        formatDateTime: formatDateTime
    };
})();
