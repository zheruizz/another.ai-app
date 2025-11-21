"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const projects_service_1 = require("../../services/projects.service");
const db_1 = __importDefault(require("../../utils/db"));
// Mock the db module
jest.mock("../../utils/db", () => ({
    query: jest.fn(),
}));
// Helper function to normalize SQL queries
const normalizeQuery = (query) => query.replace(/\s+/g, " ").trim();
describe("Projects Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("createProject", () => {
        it("should create a project", async () => {
            const mockProject = { id: 1, user_id: 1, name: "Test Project", description: "Description" };
            db_1.default.query.mockResolvedValue({ rows: [mockProject] });
            const result = await (0, projects_service_1.createProject)(1, "Test Project", "Description");
            expect(result).toEqual(mockProject);
            const expectedQuery = `
        INSERT INTO projects (user_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
            expect(normalizeQuery(db_1.default.query.mock.calls[0][0])).toBe(normalizeQuery(expectedQuery));
            expect(db_1.default.query.mock.calls[0][1]).toEqual([1, "Test Project", "Description"]);
        });
        it("should throw an error if parameters are invalid", async () => {
            await expect((0, projects_service_1.createProject)(1, "", "")).rejects.toThrow("Invalid project data");
        });
    });
    describe("getProjects", () => {
        it("should return all projects if no userId is provided", async () => {
            const mockProjects = [{ id: 1, name: "Project A" }, { id: 2, name: "Project B" }];
            db_1.default.query.mockResolvedValue({ rows: mockProjects });
            const result = await (0, projects_service_1.getProjects)();
            expect(result).toEqual(mockProjects);
            expect(db_1.default.query).toHaveBeenCalledWith("SELECT * FROM projects;", []);
        });
        it("should return projects for a specific userId", async () => {
            const mockProjects = [{ id: 1, name: "Project A" }];
            db_1.default.query.mockResolvedValue({ rows: mockProjects });
            const result = await (0, projects_service_1.getProjects)(1);
            expect(result).toEqual(mockProjects);
            expect(db_1.default.query).toHaveBeenCalledWith("SELECT * FROM projects WHERE user_id = $1;", [1]);
        });
    });
    describe("getProject", () => {
        it("should return a project by ID", async () => {
            const mockProject = { id: 1, name: "Project A" };
            db_1.default.query.mockResolvedValue({ rows: [mockProject] });
            const result = await (0, projects_service_1.getProject)(1);
            expect(result).toEqual(mockProject);
            expect(db_1.default.query).toHaveBeenCalledWith("SELECT * FROM projects WHERE id = $1;", [1]);
        });
        it("should throw an error if the project ID does not exist", async () => {
            db_1.default.query.mockResolvedValue({ rows: [] });
            await expect((0, projects_service_1.getProject)(999)).rejects.toThrow("Project not found");
        });
    });
    describe("deleteProject", () => {
        it("should delete a project by ID", async () => {
            db_1.default.query.mockResolvedValue({});
            await (0, projects_service_1.deleteProject)(1);
            const expectedQuery = "DELETE FROM projects WHERE id = $1;";
            expect(normalizeQuery(db_1.default.query.mock.calls[0][0])).toBe(normalizeQuery(expectedQuery));
            expect(db_1.default.query.mock.calls[0][1]).toEqual([1]);
        });
        it("should throw an error if the project cannot be deleted", async () => {
            db_1.default.query.mockRejectedValue(new Error("Database error"));
            await expect((0, projects_service_1.deleteProject)(1)).rejects.toThrow("Database error");
        });
    });
});
