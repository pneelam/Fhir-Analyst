
/**
 * Reads a File object and converts its content to a base64 encoded string.
 * This is necessary for sending file content within a JSON payload to the AI service.
 * @param file The file to convert.
 * @returns A Promise that resolves with the base64 encoded string of the file content.
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // The result is a data URL like "data:image/png;base64,iVBORw0KGgo...".
      // We only need the base64 part, which comes after the comma.
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};
