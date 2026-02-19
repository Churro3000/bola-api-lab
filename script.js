// Fake "users database" (never do this in real life)
const users = {
  "1": { id: "1", name: "Alice", email: "alice@example.com", role: "user" },
  "2": { id: "2", name: "Bob", email: "bob@example.com", role: "user" },
  "3": { id: "3", name: "Charlie", email: "charlie@example.com", role: "user" },
  "999": { id: "999", name: "Admin", email: "admin@example.com", role: "admin" }
};

// Fake JWT secret (in real life this is server-side and secret!)
const JWT_SECRET = "super-secret-key-for-demo-only-do-not-use";

// Simple JWT encode (base64 header + payload + signature simulation)
function createJWT(userId) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now() }));
  const signature = btoa(userId + JWT_SECRET); // Fake signature
  return `${header}.${payload}.${signature}`;
}

// Parse JWT (client-side – insecure!)
function parseJWT(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch (e) {
    return null;
  }
}

// Login handler
document.getElementById("login-btn").addEventListener("click", () => {
  const userId = document.getElementById("user-select").value;
  const token = createJWT(userId);
  localStorage.setItem("jwt", token);
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("current-user").textContent = users[userId]?.name || "Unknown";
  document.getElementById("jwt-display").textContent = token;
  document.getElementById("login-status").textContent = "Logged in! JWT stored in localStorage.";
});

// API call helper (simulates fetch to /api/...)
async function callApi(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("jwt");
  if (!token) {
    return "Error: Not logged in";
  }

  const responseBox = document.getElementById("api-response");

  // Simulate server response
  let result = { status: 200, data: {} };

  // Parse requested ID from endpoint or body
  let requestedId = null;
  if (endpoint.includes("/")) {
    requestedId = endpoint.split("/").pop(); // e.g. /api/profile/2 → "2"
  }
  if (body && body.userId) {
    requestedId = body.userId;
  }

  const user = users[requestedId];

  if (!user) {
    result = { status: 404, data: { error: "Resource not found" } };
  } else {
    // VULNERABLE: No ownership check – anyone can access any ID
    // To FIX: uncomment the line below
    // if (parseJWT(token)?.sub !== requestedId) { result = { status: 403, data: { error: "Forbidden – you do not own this resource" } }; }

    if (method === "GET") {
      result.data = user;
    } else if (method === "PUT") {
      result.data = { message: "Profile updated", updated: body };
    }
  }

  responseBox.textContent = `Status: ${result.status}\nResponse: ${JSON.stringify(result.data, null, 2)}`;
}

// Button handlers
document.getElementById("get-profile").addEventListener("click", () => {
  const payload = JSON.parse(document.getElementById("request-payload").value || "{}");
  callApi(`/api/profile/${payload.userId || "me"}`, "GET");
});

document.getElementById("get-order").addEventListener("click", () => {
  const payload = JSON.parse(document.getElementById("request-payload").value || "{}");
  callApi(`/api/orders/${payload.userId || "me"}`, "GET");
});

document.getElementById("update-profile").addEventListener("click", () => {
  const payload = JSON.parse(document.getElementById("request-payload").value || "{}");
  callApi(`/api/profile/${payload.userId || "me"}`, "PUT", payload);
});
