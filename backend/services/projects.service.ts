import db from "../utils/db";

export async function createProject(userId: number, name: string, description: string) {
  const query = `
    INSERT INTO projects (user_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [userId, name, description];
  const result = await db.query(query, values);
  return result.rows[0];
}

export async function getProjects(userId?: number) {
  const query = userId
    ? `SELECT * FROM projects WHERE user_id = $1;`
    : `SELECT * FROM projects;`;
  const values = userId ? [userId] : [];
  const result = await db.query(query, values);
  return result.rows;
}

export async function getProject(projectId: number) {
  const query = `SELECT * FROM projects WHERE id = $1;`;
  const values = [projectId];
  const result = await db.query(query, values);
  return result.rows[0];
}

export async function deleteProject(projectId: number) {
  const query = `DELETE FROM projects WHERE id = $1;`;
  const values = [projectId];
  await db.query(query, values);
}