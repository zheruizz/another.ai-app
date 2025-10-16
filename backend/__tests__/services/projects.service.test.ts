import { createProject } from "../../services/projects.service";
import db from "../../utils/db";

// Mock the db module
jest.mock("../../utils/db", () => ({
  query: jest.fn(),
}));

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

      // Normalize both the expected query and the actual query
      const normalizeQuery = (query: string) => query.replace(/\s+/g, " ").trim();

      const expectedQuery = `
        INSERT INTO projects (user_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      expect(normalizeQuery((db.query as jest.Mock).mock.calls[0][0])).toBe(normalizeQuery(expectedQuery));
      expect((db.query as jest.Mock).mock.calls[0][1]).toEqual([1, "Test Project", "Description"]);
    });
  });
});