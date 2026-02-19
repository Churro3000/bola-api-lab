// Fake users data – never do in real apps
const users = {
  "1": { name: "Alice", email: "alice@example.com", role: "user", order: "Order #1001: Shipped" },
  "2": { name: "Bob", email: "bob@example.com", role: "user", order: "Order #1002: Pending" },
  "3": { name: "Charlie", email: "charlie@example.com", role: "user", order: "Order #1003: Delivered" },
  "999": { name: "Admin", email: "admin@example.com", role: "admin", order: "All Orders Visible" }
};

// Fake JWT secret – server-side in real life
const JWT_SECRET = "fake-secret-do-not-use";

// Create fake JWT
function createJWT(userId) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now() }));
  const signature = btoa(userId + JWT_SECRET);
  return `${header}.${payload}.${signature}`;
}

// Parse JWT – client-side for demo
function parseJWT(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// Login button handler
document.getElementById("login-btn").addEventListener("click", () => {
  const userId = document.getElementById("user-select").value;
  const token = createJWT(userId);
  localStorage.setItem("jwt", token);
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("current-user").textContent = users[userId]?.name || "Unknown";
  document.getElementById("jwt-display").textContent = token;
  document.getElementById("login-status").textContent = "Logged in successfully!";
});

// Logout button handler
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("jwt");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("api-response").textContent = "";
});

// Simulated API call – vulnerable to BOLA (no ownership check)
async function callApi(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("jwt");
  if (!token) return "Error: Not logged in";

  const id = body ? body.id : endpoint.split("/").pop(); // Get ID from body or URL
  const user = users[id] || { error: "Resource not found" };

  // VULN: No check if current user owns the ID – BOLA here
  const result = method === "PUT" ? { message: "Updated", newData: body } : user;

  document.getElementById("api-response").textContent = JSON.stringify(result, null, 2);
}

// Get Profile button
document.getElementById("get-profile").addEventListener("click", () => {
  const body = JSON.parse(document.getElementById("request-payload").value || "{}");
  callApi(`/api/profile/${body.id || "me"}`);
});

// Get Order button
document.getElementById("get-order").addEventListener("click", () => {
  const body = JSON.parse(document.getElementById("request-payload").value || "{}");
  callApi(`/api/orders/${body.id || "me"}`);
});

// Update Profile button
document.getElementById("update-profile").addEventListener("click", () => {
  const body = JSON.parse(document.getElementById("request-payload").value || "{}");
  callApi(`/api/profile/${body.id || "me"}`, "PUT", body);
});
