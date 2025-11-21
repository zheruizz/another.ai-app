"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const personas_service_1 = require("../../services/personas.service");
const db_1 = __importDefault(require("../../utils/db"));
// Mock the db module
jest.mock("../../utils/db", () => ({
    query: jest.fn(),
}));
describe("Personas Service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("getPersonas", () => {
        it("should return all personas", async () => {
            const mockRows = [{ id: 1, name: "Persona A" }, { id: 2, name: "Persona B" }];
            db_1.default.query.mockResolvedValue({ rows: mockRows });
            const result = await (0, personas_service_1.getPersonas)();
            expect(result).toEqual(mockRows);
            expect(db_1.default.query).toHaveBeenCalledWith("SELECT * FROM personas;");
        });
        it("should throw an error if the database query fails", async () => {
            db_1.default.query.mockRejectedValue(new Error("Database error"));
            await expect((0, personas_service_1.getPersonas)()).rejects.toThrow("Database error");
        });
    });
    describe("getPersona", () => {
        it("should return a persona by ID", async () => {
            const mockRow = { id: 1, name: "Persona A" };
            db_1.default.query.mockResolvedValue({ rows: [mockRow] });
            const result = await (0, personas_service_1.getPersona)(1);
            expect(result).toEqual(mockRow);
            expect(db_1.default.query).toHaveBeenCalledWith("SELECT * FROM personas WHERE id = $1;", [1]);
        });
        it("should throw an error if the persona ID does not exist", async () => {
            db_1.default.query.mockResolvedValue({ rows: [] });
            await expect((0, personas_service_1.getPersona)(999)).rejects.toThrow("Persona not found");
        });
        it("should throw an error if personaId is invalid", async () => {
            await expect((0, personas_service_1.getPersona)(null)).rejects.toThrow("Invalid persona ID");
        });
    });
});
