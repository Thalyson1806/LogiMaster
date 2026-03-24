const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const BASE_URL = API_URL.replace(/\/api$/, "");




function getAuthHeader(): Record<string, string> {
    try {
        const s = typeof window !== "undefined" ? localStorage.getItem("logimaster_user") : null;
        if (s) {
            const token = JSON.parse(s).token;
            if (token) return { Authorization: `Bearer ${token}` };
        }
    } catch {}
    return {};
}

async function fetchAPI<T>(
    endpoint: string, //Ex "/customers ou /products"
    options?: RequestInit //cfg extras
): Promise<T> {


    const url = `${API_URL}${endpoint}`;


    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
            ...(options?.headers || {}),
        },
    });
   
    if (response.status === 401) {
        if (typeof window !== "undefined") {
            localStorage.removeItem("logimaster_user");
            window.location.href = "/login";
        }
        throw new Error("Sessão expirada. Faça login novamente.");
    }

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erro na requisição");
    }

    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return undefined as T;
    }

    return response.json();

}

// get
export async function getAPI<T>(endpoint: string): Promise<T> {
    return fetchAPI<T>(endpoint, { method: "GET"});
}

// post
export async function postAPI<T>(endpoint: string, data: any): Promise<T> {
    return fetchAPI<T>(endpoint, { 
        method: "POST",
        body: JSON.stringify(data),
    });
}

// put
export async function putAPI<T>(endpoint: string, data: any): Promise<T> {
    return fetchAPI<T>(endpoint, { 
        method: "PUT",
        body: JSON.stringify(data),
    });
}


//delete
export async function deleteAPI<T>(endpoint: string): Promise<T> {
    return fetchAPI<T>(endpoint, { method: "DELETE"});
}