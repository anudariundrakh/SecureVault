const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function request(path, options = {}) {
  const token = sessionStorage.getItem("securevault_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) return null;

  let data;
  try {
    data = await response.json();
  } catch {
    data = { message: "Unexpected server response." };
  }

  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  register: (email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getItems: () => request("/vault/items"),
  createItem: (item) =>
    request("/vault/items", { method: "POST", body: JSON.stringify(item) }),
  updateItem: (id, item) =>
    request(`/vault/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    }),
  deleteItem: (id) => request(`/vault/items/${id}`, { method: "DELETE" }),
};
