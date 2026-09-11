const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000/api"
    : "https://ifrs-api.hdiportal.com/api");

// Helper to check if a JWT is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;
    const decodedJson = JSON.parse(atob(payloadBase64));
    if (!decodedJson.exp) return false;
    return Date.now() >= decodedJson.exp * 1000;
  } catch (e) {
    return true;
  }
};

const handleAuthFailure = () => {
  localStorage.removeItem("hdi_token");
  localStorage.removeItem("hdi_user");
  window.dispatchEvent(new CustomEvent("hdi:auth-expired"));
};

const getHeaders = () => {
  const token = localStorage.getItem("hdi_token");
  if (token && isTokenExpired(token)) {
    handleAuthFailure();
    return { "Content-Type": "application/json" };
  }
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("hdi_token");
  if (token && isTokenExpired(token)) {
    handleAuthFailure();
    throw new Error("Session expired. Please log in again.");
  }

  const res = await fetch(url, options);
  if (res.status === 401) {
    handleAuthFailure();
    throw new Error("Session expired or unauthorized. Please log in again.");
  }
  return res;
};

export const api = {
  // Auth
  login: async (identifier, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: identifier,
        username: identifier,
        password,
      }),
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
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/auth/me`, {
        headers: getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem("hdi_token");
    localStorage.removeItem("hdi_user");
    window.dispatchEvent(new CustomEvent("hdi:auth-expired"));
  },

  // Users Management
  getUsers: async () => {
    const res = await fetchWithAuth(`${API_BASE_URL}/users`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch users");
    return data;
  },

  createUser: async (userData) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create user");
    return data;
  },

  updateUser: async (id, userData) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update user");
    return data;
  },

  deleteUser: async (id) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete user");
    return data;
  },

  // Claims
  getClaims: async () => {
    const res = await fetchWithAuth(`${API_BASE_URL}/claims`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to fetch claims");
    return data;
  },

  createClaim: async (claimData) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/claims`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(claimData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to submit claim");
    return data;
  },

  updateClaimStatus: async (claimId, status, note, documents = []) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/claims/${claimId}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status, note, documents }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update claim");
    return data;
  },

  deleteClaim: async (claimId) => {
    const res = await fetchWithAuth(`${API_BASE_URL}/claims/${claimId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete claim");
    return data;
  },
};
