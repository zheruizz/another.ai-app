"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPersonas = getPersonas;
exports.getPersona = getPersona;
const db_1 = __importDefault(require("../utils/db"));
async function getPersonas() {
    const query = `SELECT * FROM personas;`;
    const result = await db_1.default.query(query);
    return result.rows;
}
async function getPersona(personaId) {
    if (!personaId) {
        throw new Error("Invalid persona ID");
    }
    const query = `SELECT * FROM personas WHERE id = $1;`;
    const values = [personaId];
    const result = await db_1.default.query(query, values);
    if (result.rows.length === 0) {
        throw new Error("Persona not found");
    }
    return result.rows[0];
}
