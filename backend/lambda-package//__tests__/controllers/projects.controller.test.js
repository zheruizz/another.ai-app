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
const projects_controller_1 = require("../../controllers/projects.controller");
const ProjectsService = __importStar(require("../../services/projects.service"));
// Mock the service layer
jest.mock("../../services/projects.service");
describe("Projects Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("createProject", () => {
        it("should create a project and return status 201", async () => {
            // Arrange
            const mockProject = { id: 1, name: "Test Project", description: "Test Description" };
            jest.spyOn(ProjectsService, "createProject").mockResolvedValue(mockProject);
            const event = {
                body: JSON.stringify({ user_id: 1, name: "Test Project", description: "Test Description" }),
            };
            // Act
            const response = await (0, projects_controller_1.createProject)(event);
            // Assert
            expect(response.statusCode).toBe(201);
            expect(JSON.parse(response.body)).toEqual({
                message: "Project created successfully",
                project: mockProject,
            });
            expect(ProjectsService.createProject).toHaveBeenCalledWith(1, "Test Project", "Test Description");
        });
        it("should return status 500 if the service throws an error", async () => {
            // Arrange
            jest.spyOn(ProjectsService, "createProject").mockRejectedValue(new Error("Service error"));
            const event = {
                body: JSON.stringify({ user_id: 1, name: "Test Project", description: "Test Description" }),
            };
            // Act
            const response = await (0, projects_controller_1.createProject)(event);
            // Assert
            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body)).toEqual({ error: "Failed to create project" });
        });
    });
});
