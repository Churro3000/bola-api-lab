// Fake database for simulation
const fakeDatabase = {
    profiles: {
        1: { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user' },
        2: { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
        3: { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' },
        999: { id: 999, name: 'Admin', email: 'admin@example.com', role: 'admin' }
    },
    orders: {
        1: [{ orderId: 101, item: 'Book', price: 10 }],
        2: [{ orderId: 201, item: 'Laptop', price: 1000 }],
        3: [{ orderId: 301, item: 'Phone', price: 500 }],
        999: [{ orderId: 901, item: 'Server', price: 5000 }]
    }
};

// User names mapping
const userNames = {
    1: 'Alice',
    2: 'Bob',
    3: 'Charlie',
    999: 'Admin'
};

// Variables
let currentJWT = null;
let currentUserId = null;

// DOM elements
const loginCard = document.getElementById('login-card');
const userSelect = document.getElementById('user-select');
const loginBtn = document.getElementById('login-btn');
const jwtDisplay = document.getElementById('jwt-display');
const dashboard = document.getElementById('dashboard');
const currentUser = document.getElementById('current-user');
const currentJWTEl = document.getElementById('current-jwt');
const payloadTextarea = document.getElementById('payload');
const getProfileBtn = document.getElementById('get-profile-btn');
const getOrdersBtn = document.getElementById('get-orders-btn');
const putProfileBtn = document.getElementById('put-profile-btn');
const responseBox = document.getElementById('response-box');
const logoutBtn = document.getElementById('logout-btn');

// Generate fake JWT
function generateFakeJWT(userId) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: userId, name: userNames[userId], iat: Math.floor(Date.now() / 1000) }));
    const signature = btoa('fake-signature'); // Fake signature
    return `${header}.${payload}.${signature}`;
}

// Simulate API call (vulnerable to BOLA)
function simulateApi(method, endpoint, payload, jwt) {
    if (!jwt) {
        return { error: 'Unauthorized: No JWT provided' };
    }
    // In a real scenario, verify JWT here. But for simulation, we assume it's valid.

    let id;
    try {
        id = payload.id;
        if (typeof id !== 'number') id = parseInt(id, 10);
        if (isNaN(id)) throw new Error('Invalid ID');
    } catch (e) {
        return { error: 'Invalid payload: Missing or invalid "id"' };
    }

    // VULNERABILITY: No ownership check here.
    // We do not verify if the requested 'id' matches the authenticated user's ID from JWT 'sub' claim.
    // This allows any authenticated user to access/update any other user's data by changing the 'id' in the payload.
    // TO FIX: On the server-side, decode the JWT, extract 'sub', and check if sub === id before proceeding.
    // Example fix pseudocode:
    // const decoded = jwt.verify(jwt, secret);
    // if (decoded.sub !== id) return { error: 'Forbidden: You do not own this resource' };

    if (endpoint === '/api/profile/{id}') {
        if (method === 'GET') {
            const profile = fakeDatabase.profiles[id];
            return profile ? profile : { error: 'Profile not found' };
        } else if (method === 'PUT') {
            if (!fakeDatabase.profiles[id]) return { error: 'Profile not found' };
            Object.assign(fakeDatabase.profiles[id], payload); // Update with payload (including id if changed, but risky)
            return { success: 'Profile updated', updated: fakeDatabase.profiles[id] };
        }
    } else if (endpoint === '/api/orders/{id}' && method === 'GET') {
        const orders = fakeDatabase.orders[id];
        return orders ? orders : { error: 'Orders not found' };
    }
    return { error: 'Invalid endpoint or method' };
}

// Event listeners
loginBtn.addEventListener('click', () => {
    currentUserId = parseInt(userSelect.value, 10);
    currentJWT = generateFakeJWT(currentUserId);
    jwtDisplay.textContent = `JWT: ${currentJWT}`;
    jwtDisplay.classList.remove('hidden');

    // Show dashboard
    loginCard.classList.add('hidden');
    dashboard.classList.remove('hidden');
    currentUser.textContent = `${userNames[currentUserId]} (ID ${currentUserId})`;
    currentJWTEl.textContent = currentJWT;

    // Reset payload and response
    payloadTextarea.value = JSON.stringify({ id: currentUserId }, null, 2);
    responseBox.textContent = '';
});

getProfileBtn.addEventListener('click', () => {
    let payload;
    try {
        payload = JSON.parse(payloadTextarea.value);
    } catch (e) {
        responseBox.textContent = 'Invalid JSON payload';
        return;
    }
    const result = simulateApi('GET', '/api/profile/{id}', payload, currentJWT);
    responseBox.textContent = JSON.stringify(result, null, 2);
});

getOrdersBtn.addEventListener('click', () => {
    let payload;
    try {
        payload = JSON.parse(payloadTextarea.value);
    } catch (e) {
        responseBox.textContent = 'Invalid JSON payload';
        return;
    }
    const result = simulateApi('GET', '/api/orders/{id}', payload, currentJWT);
    responseBox.textContent = JSON.stringify(result, null, 2);
});

putProfileBtn.addEventListener('click', () => {
    let payload;
    try {
        payload = JSON.parse(payloadTextarea.value);
    } catch (e) {
        responseBox.textContent = 'Invalid JSON payload';
        return;
    }
    const result = simulateApi('PUT', '/api/profile/{id}', payload, currentJWT);
    responseBox.textContent = JSON.stringify(result, null, 2);
});

logoutBtn.addEventListener('click', () => {
    currentJWT = null;
    currentUserId = null;
    dashboard.classList.add('hidden');
    loginCard.classList.remove('hidden');
    jwtDisplay.classList.add('hidden');
    jwtDisplay.textContent = '';
    responseBox.textContent = '';
});

// Initial payload
payloadTextarea.value = JSON.stringify({ id: 1 }, null, 2);

// Note: To exploit BOLA, edit the 'id' in the textarea via browser (or DevTools) to another user's ID and click a button.
// Since this is client-side simulation, changes to fakeDatabase persist in memory until page refresh.
