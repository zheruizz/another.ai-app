import { getPersonas, getPersona } from "../../services/personas.service";
import db from "../../utils/db";

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
      (db.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      const result = await getPersonas();
      expect(result).toEqual(mockRows);
      expect(db.query).toHaveBeenCalledWith("SELECT * FROM personas;");
    });

    it("should throw an error if the database query fails", async () => {
      (db.query as jest.Mock).mockRejectedValue(new Error("Database error"));

      await expect(getPersonas()).rejects.toThrow("Database error");
    });
  });

  describe("getPersona", () => {
    it("should return a persona by ID", async () => {
      const mockRow = { id: 1, name: "Persona A" };
      (db.query as jest.Mock).mockResolvedValue({ rows: [mockRow] });

      const result = await getPersona(1);
      expect(result).toEqual(mockRow);
      expect(db.query).toHaveBeenCalledWith("SSELECT * FROM personas WHERE id = $1;", [1]);
    });

    it("should throw an error if the persona ID does not exist", async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(getPersona(999)).rejects.toThrow("Persona not found");
    });

    it("should throw an error if personaId is invalid", async () => {
      await expect(getPersona(null as any)).rejects.toThrow("Invalid persona ID");
    });
  });
});