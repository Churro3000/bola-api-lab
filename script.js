// Fake users – never do this in real apps
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

// Parse JWT
function parseJWT(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// Login
document.getElementById("login-btn").addEventListener("click", () => {
  const userId = document.getElementById("user-select").value;
  const token = createJWT(userId);
  localStorage.setItem("jwt", token);
  localStorage.setItem("userId", userId); // for easy tampering demo
  showDashboard(userId, token);
});

// Show dashboard
function showDashboard(userId, token) {
  document.getElementById("login-card").classList.add("hidden");
  document.getElementById("dashboard-card").classList.remove("hidden");
  document.getElementById("current-user").textContent = users[userId]?.name || "Unknown";
  document.getElementById("jwt-display").textContent = token;
}

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("jwt");
  localStorage.removeItem("userId");
  document.getElementById("dashboard-card").classList.add("hidden");
  document.getElementById("login-card").classList.remove("hidden");
  document.getElementById("api-response").textContent = "";
});

// Simulated API call – vulnerable to BOLA
function callApi(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("jwt");
  if (!token) {
    document.getElementById("api-response").textContent = "Error: Not logged in";
    return;
  }

  const id = body?.id || endpoint.split("/").pop();
  const user = users[id] || { error: "Resource not found" };

  // VULNERABLE: No ownership check – anyone can access/update any ID
  let result;
  if (method === "PUT") {
    result = { message: "Updated", updatedData: body };
  } else {
    result = user;
  }

  document.getElementById("api-response").textContent = JSON.stringify(result, null, 2);
}

// Button handlers
document.getElementById("get-profile").addEventListener("click", () => {
  const body = JSON.parse(document.getElementById("request-payload").value || "{}");
  callApi(`/api/profile/${body.id || "me"}`);
});

document.getElementById("get-order").addEventListener("click", () => {
  const body = JSON.parse(document.getElementById("request-payload").value || "{}");
  callApi(`/api/orders/${body.id || "me"}`);
});

document.getElementById("update-profile").addEventListener("click", () => {
  const body = JSON.parse(document.getElementById("request-payload").value || "{}");
  callApi(`/api/profile/${body.id || "me"}`, "PUT", body);
});

// Auto-load if already logged in
if (localStorage.getItem("jwt")) {
  const token = localStorage.getItem("jwt");
  const parsed = parseJWT(token);
  const userId = parsed?.sub || localStorage.getItem("userId");
  if (userId && users[userId]) {
    showDashboard(userId, token);
  }
}
