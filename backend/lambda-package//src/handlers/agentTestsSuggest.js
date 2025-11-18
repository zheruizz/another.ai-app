"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestTasksHandler = void 0;
const uuid_1 = require("uuid");
const suggestTasksHandler = async (event) => {
    const body = JSON.parse(event.body ?? '{}');
    if (!body.url) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing url' }),
        };
    }
    const runId = (0, uuid_1.v4)();
    const tasks = [
        {
            id: (0, uuid_1.v4)(),
            type: 'pricing_page',
            description: 'Find and open the pricing page.',
        },
        {
            id: (0, uuid_1.v4)(),
            type: 'newsletter_subscribe',
            description: 'Subscribe to the newsletter with a test email.',
        },
        {
            id: (0, uuid_1.v4)(),
            type: 'refund_policy',
            description: 'Locate and open the refund/returns policy page.',
        },
    ];
    const response = {
        runId,
        url: body.url,
        tasks,
    };
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
    };
};
exports.suggestTasksHandler = suggestTasksHandler;
