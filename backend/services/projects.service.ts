// Example service layer for projects

export async function createProject(userId: number, name: string, description: string) {
  // Implement actual DB logic here
  return { id: 1, userId, name, description };
}

export async function getProjects(userId?: number) {
  // Implement actual DB logic here
  return [{ id: 1, userId, name: "Demo Project", description: "Demo" }];
}

export async function getProject(projectId: number) {
  // Implement actual DB logic here
  return { id: projectId, name: "Demo Project", description: "Demo" };
}

export async function deleteProject(projectId: number) {
  // Implement actual DB logic here
  return;
}