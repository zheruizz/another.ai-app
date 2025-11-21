"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTestsHandler = void 0;
const runTestsHandler = async (event) => {
    const body = JSON.parse(event.body ?? '{}');
    if (!body.runId || !body.url || !body.tasks?.length) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing runId, url, or tasks' }),
        };
    }
    const tasks = body.tasks.map((t, idx) => ({
        ...t,
        success: idx !== 1, // arbitrarily fail the second one
        errorReason: idx === 1 ? 'Stub: failed for demo purposes.' : null,
        videoUrl: null,
        details: { steps: ['Stubbed runner – no real browser yet.'] },
    }));
    const successCount = tasks.filter(t => t.success).length;
    const overallScore = Math.round((successCount / tasks.length) * 100);
    const response = {
        runId: body.runId,
        overallScore,
        tasks,
    };
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
    };
};
exports.runTestsHandler = runTestsHandler;
