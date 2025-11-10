"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = createProject;
exports.getProjects = getProjects;
exports.getProject = getProject;
exports.deleteProject = deleteProject;
const ProjectService = __importStar(require("../services/projects.service"));
async function createProject(event) {
    const { user_id, name, description } = JSON.parse(event.body || "{}");
    try {
        const project = await ProjectService.createProject(user_id, name, description);
        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Project created successfully", project }),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Failed to create project" }),
        };
    }
}
async function getProjects(event) {
    const user_id = event.queryStringParameters?.user_id;
    try {
        const projects = await ProjectService.getProjects(user_id ? Number(user_id) : undefined);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projects),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Failed to fetch projects" }),
        };
    }
}
async function getProject(event) {
    const match = event.rawPath.match(/\/api\/projects\/(\d+)$/);
    const projectId = match ? Number(match[1]) : undefined;
    if (typeof projectId !== "number") {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Invalid project ID" }),
        };
    }
    try {
        const project = await ProjectService.getProject(projectId);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(project),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Failed to fetch project" }),
        };
    }
}
async function deleteProject(event) {
    const match = event.rawPath.match(/\/api\/projects\/(\d+)$/);
    const projectId = match ? Number(match[1]) : undefined;
    if (typeof projectId !== "number") {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Invalid project ID" }),
        };
    }
    try {
        await ProjectService.deleteProject(projectId);
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Project deleted successfully" }),
        };
    }
    catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Failed to delete project" }),
        };
    }
}
