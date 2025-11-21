"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const projects_controller_1 = require("../../controllers/projects.controller");
const handler = async (event /* want to support v1 & v2 */) => {
    // Fallback: support both event structures defensively
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
    if (method === "POST" && path?.endsWith("/api/projects")) {
        return await (0, projects_controller_1.createProject)(event);
    }
    if (method === "GET" && path?.endsWith("/api/projects")) {
        return await (0, projects_controller_1.getProjects)(event);
    }
    if (method === "GET" && /\/api\/projects\/\d+$/.test(path ?? "")) {
        return await (0, projects_controller_1.getProject)(event);
    }
    if (method === "DELETE" && /\/api\/projects\/\d+$/.test(path ?? "")) {
        return await (0, projects_controller_1.deleteProject)(event);
    }
    return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Not found" }),
    };
};
exports.handler = handler;
