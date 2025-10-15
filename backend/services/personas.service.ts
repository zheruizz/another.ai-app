import db from "../utils/db";

export async function getPersonas() {
  const query = `SELECT * FROM personas;`;
  const result = await db.query(query);
  return result.rows;
}

export async function getPersona(personaId: number) {
  const query = `SELECT * FROM personas WHERE id = $1;`;
  const values = [personaId];
  const result = await db.query(query, values);
  return result.rows[0];
}