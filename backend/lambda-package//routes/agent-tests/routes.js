"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const agentTestsSuggest_1 = require("../../src/handlers/agentTestsSuggest");
const agentTestsRun_1 = require("../../src/handlers/agentTestsRun");
const handler = async (event) => {
    let method;
    let path;
    if (event.requestContext && event.requestContext.http && event.requestContext.http.method) {
        method = event.requestContext.http.method;
        path = event.rawPath;
    }
    else if (event.httpMethod && event.path) {
        method = event.httpMethod;
        path = event.path;
    }
    // POST /api/agent-tests/suggest-tasks
    if (method === "POST" && path?.endsWith("/api/agent-tests/suggest-tasks")) {
        return await (0, agentTestsSuggest_1.suggestTasksHandler)(event);
    }
    // POST /api/agent-tests/run
    if (method === "POST" && path?.endsWith("/api/agent-tests/run")) {
        return await (0, agentTestsRun_1.runTestsHandler)(event);
    }
    // Default: Not found
    return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Not found" }),
    };
};
exports.handler = handler;
