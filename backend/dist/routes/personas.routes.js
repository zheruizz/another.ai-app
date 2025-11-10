"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const personas_controller_1 = require("../controllers/personas.controller");
const handler = async (event) => {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    // List personas: GET /api/personas
    if (method === "GET" && path.endsWith("/api/personas")) {
        return await (0, personas_controller_1.getPersonas)(event);
    }
    // Get persona: GET /api/personas/{personaId}
    if (method === "GET" && /\/api\/personas\/\d+$/.test(path)) {
        return await (0, personas_controller_1.getPersona)(event);
    }
    return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Not found" }),
    };
};
exports.handler = handler;
