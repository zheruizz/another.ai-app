import { getPersonas, getPersona } from "../../controllers/personas.controller";
import * as PersonasService from "../../services/personas.service";
import { APIGatewayProxyEventV2 } from "aws-lambda";

// Mock the service layer
jest.mock("../../services/personas.service");

describe("Personas Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPersonas", () => {
    it("should return a list of personas with status 200", async () => {
      // Arrange
      const mockPersonas = [{ id: 1, name: "Persona A" }, { id: 2, name: "Persona B" }];
      jest.spyOn(PersonasService, "getPersonas").mockResolvedValue(mockPersonas);

      const event = {} as APIGatewayProxyEventV2; // Mock API Gateway event

      // Act
      const response = await getPersonas(event);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockPersonas);
      expect(PersonasService.getPersonas).toHaveBeenCalled();
    });

    it("should return status 500 if the service throws an error", async () => {
      // Arrange
      jest.spyOn(PersonasService, "getPersonas").mockRejectedValue(new Error("Service error"));

      const event = {} as APIGatewayProxyEventV2;

      // Act
      const response = await getPersonas(event);

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: "Failed to fetch personas" });
      expect(PersonasService.getPersonas).toHaveBeenCalled();
    });
  });

  describe("getPersona", () => {
    it("should return a persona with status 200", async () => {
      // Arrange
      const mockPersona = { id: 1, name: "Persona A" };
      jest.spyOn(PersonasService, "getPersona").mockResolvedValue(mockPersona);

      const event = {
        rawPath: "/api/personas/1",
      } as APIGatewayProxyEventV2;

      // Act
      const response = await getPersona(event);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockPersona);
      expect(PersonasService.getPersona).toHaveBeenCalledWith(1); // Ensure the correct ID is passed
    });

    it("should return status 400 for an invalid persona ID", async () => {
      // Arrange
      const event = {
        rawPath: "/api/personas/invalid",
      } as APIGatewayProxyEventV2;

      // Act
      const response = await getPersona(event);

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({ error: "Invalid persona ID" });
    });

    it("should return status 500 if the service throws an error", async () => {
      // Arrange
      jest.spyOn(PersonasService, "getPersona").mockRejectedValue(new Error("Service error"));

      const event = {
        rawPath: "/api/personas/1",
      } as APIGatewayProxyEventV2;

      // Act
      const response = await getPersona(event);

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ error: "Failed to fetch persona" });
      expect(PersonasService.getPersona).toHaveBeenCalledWith(1);
    });
  });
});