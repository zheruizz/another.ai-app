import { createProject, getProjects } from "../../controllers/projects.controller";
import * as ProjectsService from "../../services/projects.service";
import { APIGatewayProxyEventV2 } from "aws-lambda";

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
      } as APIGatewayProxyEventV2;

      // Act
      const response = await createProject(event);

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
      } as APIGatewayProxyEventV2;

      // Act
      const response = await createProject(event);

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: "Failed to create project" });
    });
  });
});