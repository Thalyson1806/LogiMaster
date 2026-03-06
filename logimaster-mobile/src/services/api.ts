// Wi-Fi (desenvolvimento/interno): http://192.168.0.133:5000
// 4G (externo): http://SEU_IP_PUBLICO:65420
export const BASE_URL = "http://192.168.0.133:5000";
const API_URL = `${BASE_URL}/api`;


export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Erro na requisição");
  }

  return response.json();
}

export const getAPI = <T>(endpoint: string) => fetchAPI<T>(endpoint);

export const postAPI = <T>(endpoint: string, data?: object) =>
  fetchAPI<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
