"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const surveys_service_1 = require("../../services/surveys.service");
const db_1 = __importDefault(require("../../utils/db"));
// Mock the db module
jest.mock("../../utils/db", () => ({
    query: jest.fn(),
}));
// Helper function to normalize SQL queries
const normalizeQuery = (query) => query.replace(/\s+/g, " ").trim();
describe("Surveys Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("createSurvey", () => {
        it("should create a survey", async () => {
            const mockSurvey = { id: 1, project_id: 1, name: "Survey 1" };
            db_1.default.query.mockResolvedValue({ rows: [mockSurvey] });
            const result = await (0, surveys_service_1.createSurvey)(1, "Survey 1");
            expect(result).toEqual(mockSurvey);
            const expectedQuery = `
        INSERT INTO surveys (project_id, name)
        VALUES ($1, $2)
        RETURNING *;
      `;
            expect(normalizeQuery(db_1.default.query.mock.calls[0][0])).toBe(normalizeQuery(expectedQuery));
            expect(db_1.default.query.mock.calls[0][1]).toEqual([1, "Survey 1"]);
        });
        it("should throw an error if the query fails", async () => {
            db_1.default.query.mockRejectedValue(new Error("Database error"));
            await expect((0, surveys_service_1.createSurvey)(1, "Survey 1")).rejects.toThrow("Database error");
        });
    });
    describe("getSurveys", () => {
        it("should return all surveys if no projectId is provided", async () => {
            const mockSurveys = [{ id: 1, name: "Survey A" }, { id: 2, name: "Survey B" }];
            db_1.default.query.mockResolvedValue({ rows: mockSurveys });
            const result = await (0, surveys_service_1.getSurveys)();
            expect(result).toEqual(mockSurveys);
            expect(db_1.default.query).toHaveBeenCalledWith("SELECT * FROM surveys;", []);
        });
        it("should return surveys for a specific projectId", async () => {
            const mockSurveys = [{ id: 1, name: "Survey A" }];
            db_1.default.query.mockResolvedValue({ rows: mockSurveys });
            const result = await (0, surveys_service_1.getSurveys)(1);
            expect(result).toEqual(mockSurveys);
            expect(db_1.default.query).toHaveBeenCalledWith("SELECT * FROM surveys WHERE project_id = $1;", [1]);
        });
    });
    describe("addQuestion", () => {
        it("should add a question to a survey", async () => {
            const mockQuestion = { id: 1, question_text: "Question?", variant_a: "A", variant_b: "B" };
            db_1.default.query.mockResolvedValue({ rows: [mockQuestion] });
            const result = await (0, surveys_service_1.addQuestion)(1, "Question?", "A", "B");
            expect(result).toEqual(mockQuestion);
            const expectedQuery = `
        INSERT INTO survey_questions (survey_id, question_text, variant_a, variant_b)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
            expect(normalizeQuery(db_1.default.query.mock.calls[0][0])).toBe(normalizeQuery(expectedQuery));
            expect(db_1.default.query.mock.calls[0][1]).toEqual([1, "Question?", "A", "B"]);
        });
    });
    describe("runSurvey", () => {
        it("should return a success message with surveyId and personaIds", async () => {
            const result = await (0, surveys_service_1.runSurvey)(1, [1, 2, 3]);
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
            db_1.default.query.mockResolvedValue({ rows: mockResults });
            const result = await (0, surveys_service_1.getSurveyResults)(1);
            expect(result).toEqual(mockResults);
            const expectedQuery = `
        SELECT * FROM survey_results WHERE survey_id = $1;
      `;
            expect(normalizeQuery(db_1.default.query.mock.calls[0][0])).toBe(normalizeQuery(expectedQuery));
            expect(db_1.default.query.mock.calls[0][1]).toEqual([1]);
        });
    });
    describe("deleteSurvey", () => {
        it("should delete a survey by ID", async () => {
            db_1.default.query.mockResolvedValue({});
            await (0, surveys_service_1.deleteSurvey)(1);
            const expectedQuery = "DELETE FROM surveys WHERE id = $1;";
            expect(normalizeQuery(db_1.default.query.mock.calls[0][0])).toBe(normalizeQuery(expectedQuery));
            expect(db_1.default.query.mock.calls[0][1]).toEqual([1]);
        });
    });
});
