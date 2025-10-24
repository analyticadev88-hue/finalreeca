// Cache for storing in-flight requests
const processingRequests = new Map<string, Promise<any>>();

// Generate a unique key for a request based on method, url and payload
export function generateRequestKey(method: string, url: string, payload?: any): string {
  let key = `${method}:${url}`;
  if (payload) {
    key += `:${JSON.stringify(payload)}`;
  }
  return key;
}

export async function deduplicateRequest<T>(
  key: string,
  operation: () => Promise<T>
): Promise<T> {
  console.log(`[RequestDeduplication] Request received with key: ${key}`);
  
  if (processingRequests.has(key)) {
    console.log(`[RequestDeduplication] Duplicate request detected for key: ${key}`);
    console.log(`[RequestDeduplication] Using cached request`);
    return processingRequests.get(key)!;
  }

  console.log(`[RequestDeduplication] New request - proceeding with operation`);
  const promise = operation();
  processingRequests.set(key, promise);
  
  try {
    const result = await promise;
    console.log(`[RequestDeduplication] Operation completed successfully for key: ${key}`);
    return result;
  } catch (error) {
    console.error(`[RequestDeduplication] Operation failed for key: ${key}`, error);
    throw error;
  } finally {
    console.log(`[RequestDeduplication] Cleaning up cache for key: ${key}`);
    processingRequests.delete(key);
  }
}