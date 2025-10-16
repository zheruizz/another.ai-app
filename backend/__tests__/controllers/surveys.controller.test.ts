import {
  createSurvey,
  getSurveys,
  addQuestion,
  runSurvey,
  getSurveyResults,
  deleteSurvey,
} from "../../controllers/surveys.controller";
import * as SurveysService from "../../services/surveys.service";
import { APIGatewayProxyEventV2 } from "aws-lambda";

// Mock the service layer
jest.mock("../../services/surveys.service");

describe("Surveys Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSurvey", () => {
    it("should create a survey and return status 201", async () => {
      const mockSurvey = { id: 1, project_id: 1, name: "Survey 1" };
      jest.spyOn(SurveysService, "createSurvey").mockResolvedValue(mockSurvey);

      const event = {
        body: JSON.stringify({ project_id: 1, name: "Survey 1" }),
      } as APIGatewayProxyEventV2;

      const response = await createSurvey(event);

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        message: "Survey created successfully",
        survey: mockSurvey,
      });
      expect(SurveysService.createSurvey).toHaveBeenCalledWith(1, "Survey 1");
    });

    it("should return status 500 if the service throws an error", async () => {
      jest.spyOn(SurveysService, "createSurvey").mockRejectedValue(new Error("Service error"));

      const event = {
        body: JSON.stringify({ project_id: 1, name: "Survey 1" }),
      } as APIGatewayProxyEventV2;

      const response = await createSurvey(event);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: "Failed to create survey" });
    });
  });

  describe("getSurveys", () => {
    it("should return surveys for a project with status 200", async () => {
      const mockSurveys = [{ id: 1, name: "Survey A" }];
      jest.spyOn(SurveysService, "getSurveys").mockResolvedValue(mockSurveys);

      const event = {
        rawPath: "/api/projects/1/surveys",
      } as APIGatewayProxyEventV2;

      const response = await getSurveys(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockSurveys);
      expect(SurveysService.getSurveys).toHaveBeenCalledWith(1);
    });

    it("should return status 500 if the service throws an error", async () => {
      jest.spyOn(SurveysService, "getSurveys").mockRejectedValue(new Error("Service error"));

      const event = {
        rawPath: "/api/projects/1/surveys",
      } as APIGatewayProxyEventV2;

      const response = await getSurveys(event);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: "Failed to fetch surveys" });
    });
  });

  describe("addQuestion", () => {
    it("should add a question to a survey and return status 201", async () => {
      const mockQuestion = { id: 1, question_text: "Question?", variant_a: "A", variant_b: "B" };
      jest.spyOn(SurveysService, "addQuestion").mockResolvedValue(mockQuestion);

      const event = {
        rawPath: "/api/surveys/1/questions",
        body: JSON.stringify({
          question_text: "Question?",
          variant_a: "A",
          variant_b: "B",
        }),
      } as APIGatewayProxyEventV2;

      const response = await addQuestion(event);

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        message: "Question added successfully",
        question: mockQuestion,
      });
      expect(SurveysService.addQuestion).toHaveBeenCalledWith(1, "Question?", "A", "B");
    });

    it("should return status 400 for invalid survey ID", async () => {
      const event = {
        rawPath: "/api/surveys/invalid/questions",
        body: JSON.stringify({
          question_text: "Question?",
          variant_a: "A",
          variant_b: "B",
        }),
      } as APIGatewayProxyEventV2;

      const response = await addQuestion(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ error: "Invalid survey ID" });
    });

    it("should return status 500 if the service throws an error", async () => {
      jest.spyOn(SurveysService, "addQuestion").mockRejectedValue(new Error("Service error"));

      const event = {
        rawPath: "/api/surveys/1/questions",
        body: JSON.stringify({
          question_text: "Question?",
          variant_a: "A",
          variant_b: "B",
        }),
      } as APIGatewayProxyEventV2;

      const response = await addQuestion(event);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: "Failed to add question" });
    });
  });

  describe("runSurvey", () => {
    it("should run a survey and return status 200", async () => {
      const mockResult = { message: "Survey run successfully", surveyId: 1, personaIds: [1, 2, 3] };
      jest.spyOn(SurveysService, "runSurvey").mockResolvedValue(mockResult);

      const event = {
        rawPath: "/api/surveys/1/run",
        body: JSON.stringify({ persona_ids: [1, 2, 3] }),
      } as APIGatewayProxyEventV2;

      const response = await runSurvey(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockResult);
      expect(SurveysService.runSurvey).toHaveBeenCalledWith(1, [1, 2, 3]);
    });

    it("should return status 400 for invalid survey ID", async () => {
      const event = {
        rawPath: "/api/surveys/invalid/run",
        body: JSON.stringify({ persona_ids: [1, 2, 3] }),
      } as APIGatewayProxyEventV2;

      const response = await runSurvey(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ error: "Invalid survey ID" });
    });

    it("should return status 500 if the service throws an error", async () => {
      jest.spyOn(SurveysService, "runSurvey").mockRejectedValue(new Error("Service error"));

      const event = {
        rawPath: "/api/surveys/1/run",
        body: JSON.stringify({ persona_ids: [1, 2, 3] }),
      } as APIGatewayProxyEventV2;

      const response = await runSurvey(event);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: "Failed to run survey" });
    });
  });

  describe("deleteSurvey", () => {
    it("should delete a survey and return status 200", async () => {
      jest.spyOn(SurveysService, "deleteSurvey").mockResolvedValue();

      const event = {
        rawPath: "/api/surveys/1",
      } as APIGatewayProxyEventV2;

      const response = await deleteSurvey(event);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ message: "Survey deleted successfully" });
      expect(SurveysService.deleteSurvey).toHaveBeenCalledWith(1);
    });

    it("should return status 400 for invalid survey ID", async () => {
      const event = {
        rawPath: "/api/surveys/invalid",
      } as APIGatewayProxyEventV2;

      const response = await deleteSurvey(event);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ error: "Invalid survey ID" });
    });

    it("should return status 500 if the service throws an error", async () => {
      jest.spyOn(SurveysService, "deleteSurvey").mockRejectedValue(new Error("Service error"));

      const event = {
        rawPath: "/api/surveys/1",
      } as APIGatewayProxyEventV2;

      const response = await deleteSurvey(event);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: "Failed to delete survey" });
    });
  });
});