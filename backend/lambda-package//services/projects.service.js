"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = createProject;
exports.getProjects = getProjects;
exports.getProject = getProject;
exports.deleteProject = deleteProject;
const db_1 = __importDefault(require("../utils/db"));
async function createProject(userId, name, description) {
    if (!userId || !name || !description) {
        throw new Error("Invalid project data");
    }
    const query = `
    INSERT INTO projects (user_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
    const values = [userId, name, description];
    const result = await db_1.default.query(query, values);
    return result.rows[0];
}
async function getProjects(userId) {
    const query = userId
        ? `SELECT * FROM projects WHERE user_id = $1;`
        : `SELECT * FROM projects;`;
    const values = userId ? [userId] : [];
    const result = await db_1.default.query(query, values);
    return result.rows;
}
async function getProject(projectId) {
    const query = `SELECT * FROM projects WHERE id = $1;`;
    const values = [projectId];
    const result = await db_1.default.query(query, values);
    if (result.rows.length === 0) {
        throw new Error("Project not found");
    }
    return result.rows[0];
}
async function deleteProject(projectId) {
    const query = `DELETE FROM projects WHERE id = $1;`;
    const values = [projectId];
    await db_1.default.query(query, values);
}
