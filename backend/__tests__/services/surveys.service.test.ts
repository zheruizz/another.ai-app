import {
  createSurvey,
  getSurveys,
  addQuestion,
  runSurvey,
  getSurveyResults,
  deleteSurvey,
} from "../../services/surveys.service";
import db from "../../utils/db";

// Mock the db module
jest.mock("../../utils/db", () => ({
  query: jest.fn(),
}));

// Helper function to normalize SQL queries
const normalizeQuery = (query: string) => query.replace(/\s+/g, " ").trim();

describe("Surveys Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSurvey", () => {
    it("should create a survey", async () => {
      const mockSurvey = { id: 1, project_id: 1, name: "Survey 1" };
      (db.query as jest.Mock).mockResolvedValue({ rows: [mockSurvey] });

      const result = await createSurvey(1, "Survey 1");
      expect(result).toEqual(mockSurvey);

      const expectedQuery = `
        INSERT INTO surveys (project_id, name)
        VALUES ($1, $2)
        RETURNING *;
      `;
      expect(normalizeQuery((db.query as jest.Mock).mock.calls[0][0])).toBe(
        normalizeQuery(expectedQuery)
      );
      expect((db.query as jest.Mock).mock.calls[0][1]).toEqual([1, "Survey 1"]);
    });

    it("should throw an error if the query fails", async () => {
      (db.query as jest.Mock).mockRejectedValue(new Error("Database error"));

      await expect(createSurvey(1, "Survey 1")).rejects.toThrow("Database error");
    });
  });

  describe("getSurveys", () => {
    it("should return all surveys if no projectId is provided", async () => {
      const mockSurveys = [{ id: 1, name: "Survey A" }, { id: 2, name: "Survey B" }];
      (db.query as jest.Mock).mockResolvedValue({ rows: mockSurveys });

      const result = await getSurveys();
      expect(result).toEqual(mockSurveys);
      expect(db.query).toHaveBeenCalledWith("SELECT * FROM surveys;", []);
    });

    it("should return surveys for a specific projectId", async () => {
      const mockSurveys = [{ id: 1, name: "Survey A" }];
      (db.query as jest.Mock).mockResolvedValue({ rows: mockSurveys });

      const result = await getSurveys(1);
      expect(result).toEqual(mockSurveys);
      expect(db.query).toHaveBeenCalledWith("SELECT * FROM surveys WHERE project_id = $1;", [1]);
    });
  });

  describe("addQuestion", () => {
    it("should add a question to a survey", async () => {
      const mockQuestion = { id: 1, question_text: "Question?", variant_a: "A", variant_b: "B" };
      (db.query as jest.Mock).mockResolvedValue({ rows: [mockQuestion] });

      const result = await addQuestion(1, "Question?", "A", "B");
      expect(result).toEqual(mockQuestion);

      const expectedQuery = `
        INSERT INTO survey_questions (survey_id, question_text, variant_a, variant_b)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      expect(normalizeQuery((db.query as jest.Mock).mock.calls[0][0])).toBe(
        normalizeQuery(expectedQuery)
      );
      expect((db.query as jest.Mock).mock.calls[0][1]).toEqual([1, "Question?", "A", "B"]);
    });
  });

  describe("runSurvey", () => {
    it("should return a success message with surveyId and personaIds", async () => {
      const result = await runSurvey(1, [1, 2, 3]);
      expect(result).toEqual({
        message: "Survey run successfully",
        surveyId: 1,
        personaIds: [1, 2, 3],
      });
    });
  });

  describe("getSurveyResults", () => {
    it("should return results for a survey", async () => {
      const mockResults = [{ id: 1, result: "some result" }];
      (db.query as jest.Mock).mockResolvedValue({ rows: mockResults });

      const result = await getSurveyResults(1);
      expect(result).toEqual(mockResults);

      const expectedQuery = `
        SELECT * FROM survey_results WHERE survey_id = $1;
      `;
      expect(normalizeQuery((db.query as jest.Mock).mock.calls[0][0])).toBe(
        normalizeQuery(expectedQuery)
      );
      expect((db.query as jest.Mock).mock.calls[0][1]).toEqual([1]);
    });
  });

  describe("deleteSurvey", () => {
    it("should delete a survey by ID", async () => {
      (db.query as jest.Mock).mockResolvedValue({});

      await deleteSurvey(1);
      const expectedQuery = "DELETE FROM surveys WHERE id = $1;";
      expect(normalizeQuery((db.query as jest.Mock).mock.calls[0][0])).toBe(
        normalizeQuery(expectedQuery)
      );
      expect((db.query as jest.Mock).mock.calls[0][1]).toEqual([1]);
    });
  });
});