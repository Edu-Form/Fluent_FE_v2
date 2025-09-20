export const API = "http://13.54.77.128";

// Note: This function calls the internal Next.js API, not the external API base URL.
export async function getStudentsForTeacher(teacherName: string) {
  // Using a relative path for internal API routes
  const response = await fetch(`/api/teachers/${teacherName}/students`);

  if (!response.ok) {
    const errorData = await response.json();
    // Use the error message from the API if available, otherwise a default one
    throw new Error(errorData.message || 'Failed to fetch student list');
  }

  return response.json();
}

