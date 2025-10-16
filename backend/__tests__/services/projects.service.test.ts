import { createProject, getProjects, getProject, deleteProject } from "../../services/projects.service";
import db from "../../utils/db";

// Mock the db module
jest.mock("../../utils/db", () => ({
  query: jest.fn(),
}));

// Helper function to normalize SQL queries
const normalizeQuery = (query: string) => query.replace(/\s+/g, " ").trim();

describe("Projects Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createProject", () => {
    it("should create a project", async () => {
      const mockProject = { id: 1, user_id: 1, name: "Test Project", description: "Description" };
      (db.query as jest.Mock).mockResolvedValue({ rows: [mockProject] });

      const result = await createProject(1, "Test Project", "Description");
      expect(result).toEqual(mockProject);

      const expectedQuery = `
        INSERT INTO projects (user_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      expect(normalizeQuery((db.query as jest.Mock).mock.calls[0][0])).toBe(
        normalizeQuery(expectedQuery)
      );
      expect((db.query as jest.Mock).mock.calls[0][1]).toEqual([1, "Test Project", "Description"]);
    });

    it("should throw an error if parameters are invalid", async () => {
      await expect(createProject(1, "", "")).rejects.toThrow("Invalid project data");
    });
  });

  describe("getProjects", () => {
    it("should return all projects if no userId is provided", async () => {
      const mockProjects = [{ id: 1, name: "Project A" }, { id: 2, name: "Project B" }];
      (db.query as jest.Mock).mockResolvedValue({ rows: mockProjects });

      const result = await getProjects();
      expect(result).toEqual(mockProjects);
      expect(db.query).toHaveBeenCalledWith("SELECT * FROM projects;", []);
    });

    it("should return projects for a specific userId", async () => {
      const mockProjects = [{ id: 1, name: "Project A" }];
      (db.query as jest.Mock).mockResolvedValue({ rows: mockProjects });

      const result = await getProjects(1);
      expect(result).toEqual(mockProjects);
      expect(db.query).toHaveBeenCalledWith("SELECT * FROM projects WHERE user_id = $1;", [1]);
    });
  });

  describe("getProject", () => {
    it("should return a project by ID", async () => {
      const mockProject = { id: 1, name: "Project A" };
      (db.query as jest.Mock).mockResolvedValue({ rows: [mockProject] });

      const result = await getProject(1);
      expect(result).toEqual(mockProject);
      expect(db.query).toHaveBeenCalledWith("SELECT * FROM projects WHERE id = $1;", [1]);
    });

    it("should throw an error if the project ID does not exist", async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(getProject(999)).rejects.toThrow("Project not found");
    });
  });

  describe("deleteProject", () => {
    it("should delete a project by ID", async () => {
      (db.query as jest.Mock).mockResolvedValue({});

      await deleteProject(1);
      const expectedQuery = "DELETE FROM projects WHERE id = $1;";
      expect(normalizeQuery((db.query as jest.Mock).mock.calls[0][0])).toBe(
        normalizeQuery(expectedQuery)
      );
      expect((db.query as jest.Mock).mock.calls[0][1]).toEqual([1]);
    });

    it("should throw an error if the project cannot be deleted", async () => {
      (db.query as jest.Mock).mockRejectedValue(new Error("Database error"));

      await expect(deleteProject(1)).rejects.toThrow("Database error");
    });
  });
});