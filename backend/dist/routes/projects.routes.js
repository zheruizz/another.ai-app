"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const projects_controller_1 = require("../controllers/projects.controller");
const handler = async (event) => {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    // Create project: POST /api/projects
    if (method === "POST" && path.endsWith("/api/projects")) {
        return await (0, projects_controller_1.createProject)(event);
    }
    // List projects: GET /api/projects
    if (method === "GET" && path.endsWith("/api/projects")) {
        return await (0, projects_controller_1.getProjects)(event);
    }
    // Get project: GET /api/projects/{projectId}
    if (method === "GET" && /\/api\/projects\/\d+$/.test(path)) {
        return await (0, projects_controller_1.getProject)(event);
    }
    // Delete project: DELETE /api/projects/{projectId}
    if (method === "DELETE" && /\/api\/projects\/\d+$/.test(path)) {
        return await (0, projects_controller_1.deleteProject)(event);
    }
    return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Not found" }),
    };
};
exports.handler = handler;
