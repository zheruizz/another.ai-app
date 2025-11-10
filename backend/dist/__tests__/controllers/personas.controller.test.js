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
const personas_controller_1 = require("../../controllers/personas.controller");
const PersonasService = __importStar(require("../../services/personas.service"));
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
            const event = {}; // Mock API Gateway event
            // Act
            const response = await (0, personas_controller_1.getPersonas)(event);
            // Assert
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual(mockPersonas);
            expect(PersonasService.getPersonas).toHaveBeenCalled();
        });
        it("should return status 500 if the service throws an error", async () => {
            // Arrange
            jest.spyOn(PersonasService, "getPersonas").mockRejectedValue(new Error("Service error"));
            const event = {};
            // Act
            const response = await (0, personas_controller_1.getPersonas)(event);
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
            };
            // Act
            const response = await (0, personas_controller_1.getPersona)(event);
            // Assert
            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual(mockPersona);
            expect(PersonasService.getPersona).toHaveBeenCalledWith(1); // Ensure the correct ID is passed
        });
        it("should return status 400 for an invalid persona ID", async () => {
            // Arrange
            const event = {
                rawPath: "/api/personas/invalid",
            };
            // Act
            const response = await (0, personas_controller_1.getPersona)(event);
            // Assert
            expect(response.statusCode).toBe(400);
            expect(JSON.parse(response.body)).toEqual({ error: "Invalid persona ID" });
        });
        it("should return status 500 if the service throws an error", async () => {
            // Arrange
            jest.spyOn(PersonasService, "getPersona").mockRejectedValue(new Error("Service error"));
            const event = {
                rawPath: "/api/personas/1",
            };
            // Act
            const response = await (0, personas_controller_1.getPersona)(event);
            // Assert
            expect(response.statusCode).toBe(500);
            expect(JSON.parse(response.body)).toEqual({ error: "Failed to fetch persona" });
            expect(PersonasService.getPersona).toHaveBeenCalledWith(1);
        });
    });
});
