const API_BASE_URL = "https://ifrs-api.hdiportal.com/api";

const getHeaders = () => {
  const token = localStorage.getItem("hdi_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    if (data.token) {
      localStorage.setItem("hdi_token", data.token);
      localStorage.setItem("hdi_user", JSON.stringify(data));
    }
    return data;
  },

  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  },

  logout: () => {
    localStorage.removeItem("hdi_token");
    localStorage.removeItem("hdi_user");
  },

  // Users Management
  getUsers: async () => {
    const res = await fetch(`${API_BASE_URL}/users`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch users");
    return data;
  },

  createUser: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create user");
    return data;
  },

  updateUser: async (id, userData) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update user");
    return data;
  },

  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete user");
    return data;
  },

  // Claims
  getClaims: async () => {
    const res = await fetch(`${API_BASE_URL}/claims`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch claims");
    return data;
  },

  createClaim: async (claimData) => {
    const res = await fetch(`${API_BASE_URL}/claims`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(claimData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to submit claim");
    return data;
  },

  updateClaimStatus: async (claimId, status, note) => {
    const res = await fetch(`${API_BASE_URL}/claims/${claimId}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status, note }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update claim");
    return data;
  },

  deleteClaim: async (claimId) => {
    const res = await fetch(`${API_BASE_URL}/claims/${claimId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete claim");
    return data;
  },
};
