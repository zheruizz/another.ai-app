"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const personas_controller_1 = require("../../controllers/personas.controller");
const handler = async (event // Support v1 and v2 events
) => {
    // Type-flexible extraction for method and path
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
    // List personas: GET /api/personas
    if (method === "GET" && path?.endsWith("/api/personas")) {
        return await (0, personas_controller_1.getPersonas)(event);
    }
    // Get persona: GET /api/personas/{personaId}
    if (method === "GET" && /\/api\/personas\/\d+$/.test(path ?? "")) {
        return await (0, personas_controller_1.getPersona)(event);
    }
    return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Not found" }),
    };
};
exports.handler = handler;
