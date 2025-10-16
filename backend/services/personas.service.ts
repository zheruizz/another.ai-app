import db from "../utils/db";

export async function getPersonas() {
  const query = `SELECT * FROM personas;`;
  const result = await db.query(query);
  return result.rows;
}

export async function getPersona(personaId: number) {
  if (!personaId) {
    throw new Error("Invalid persona ID");
  }

  const query = `SELECT * FROM personas WHERE id = $1;`;
  const values = [personaId];
  const result = await db.query(query, values);

  if (result.rows.length === 0) {
    throw new Error("Persona not found");
  }

  return result.rows[0];
}