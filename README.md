# Broken Object Level Authorization (BOLA) API Lab – OWASP API Top 10 #1

## Overview
This is a simple static web app built with HTML, CSS, and JavaScript, hosted on GitHub Pages, to demonstrate **Broken Object Level Authorization (BOLA)**, which is #1 on the OWASP API Top 10 vulnerabilities. BOLA occurs when an API fails to enforce proper authorization checks on objects (like user profiles or orders), allowing authenticated users to access or modify data they don't own by simply changing an identifier (e.g., an "id" in a request).

## Explanation of the Project
- **BOLA Vulnerability**: The simulated API doesn't check if the requested "id" matches the logged-in user's ID (from JWT's "sub" claim). Any user can change the payload ID to access others' data.
- **JWT Role**: Fake token for auth. It contains user info (base64-encoded). Real JWTs are secure; here it's for demo.
- **GET/PUT**: HTTP methods – GET reads data, PUT updates. Buttons simulate API requests.
- **Payload Textarea**: Represents request body. Editable to show tampering ease.
- **Refresh Persistence**: Uses localStorage to save/restore session – mimics real apps (e.g., cookies/tokens).
- **Why Simulate?**: Safe, no server needed. Teaches: Always verify ownership server-side!
- **Limitations**: Client-side only – data resets on full refresh/cache clear. No real security.

In this lab:
- You simulate logging in as different users (Alice, Bob, Charlie, Admin) and get a fake JWT (JSON Web Token) for authentication.
- You make simulated API calls (GET profile, GET orders, PUT profile) using a JSON payload.
- The simulation is vulnerable to BOLA: Change the "id" in the payload to access/update other users' data.
- Login persists across page refreshes using localStorage (until you logout).
- All runs client-side in the browser – no real server or database.

## Step-by-Step Guide: How to Test the App
Follow these steps to run and test the lab. Use a modern browser like Chrome for best results (with DevTools for advanced exploits).

### Step 1: Access the Live Site
1. Open the GitHub Pages URL (e.g., `https://churro3000.github.io/bola-api-lab/`).
2. You should see a dark-themed login card:
   - Title: "BOLA API Lab"
   - Description: "Demonstrating Broken Object Level Authorization (OWASP API Top 10 #1)"
   - Dropdown: Select User (Alice ID 1, Bob ID 2, Charlie ID 3, Admin ID 999)
   - Button: "Login & Get JWT"

### Step 2: Log In as a Normal User (e.g., Alice)
1. Select "Alice (ID 1)" from the dropdown.
2. Click "Login & Get JWT".
3. Result:
   - A fake JWT (long base64 string like "eyJ...") appears.
   - Login card hides.
   - Dashboard shows: "Current User: Alice (ID 1)", "JWT: [token]", textarea with `{"id":1}`, buttons for GET/GET/PUT, response box, and Logout.
4. **Test Refresh Persistence**:
   - Refresh the page (F5 or Ctrl+R).
   - You should stay logged in as Alice (dashboard visible, no need to re-login). This simulates real session persistence using localStorage.
   - If you close/reopen the browser tab, it should still persist (until you clear browser data or logout).

### Step 3: Test Legitimate API Calls (Own Data)
1. Keep textarea as `{"id":1}`.
2. Click "GET /api/profile/{id}".
   - Response box: `{"id":1,"name":"Alice","email":"alice@example.com","role":"user"}`.
3. Click "GET /api/orders/{id}".
   - Response: `[{"orderId":101,"item":"Book","price":10}]`.
4. Test UPDATE:
   - Edit textarea: `{"id":1, "email":"newalice@example.com"}`.
   - Click "PUT /api/profile/{id}".
   - Response: Success with updated profile.
   - Click GET profile again to verify change.
5. Refresh the page – stay logged in, changes persist in memory (until full cache clear).

### Step 4: Exploit BOLA (Access Other Users' Data)
1. Logged in as Alice, edit textarea: `{"id":2}` (Bob's ID).
2. Click "GET /api/profile/{id}".
   - Response: Bob's profile – exploit successful!
3. Click "GET /api/orders/{id}".
   - Bob's orders appear.
4. Escalate: Change to `{"id":999}` (Admin).
   - GET profile/orders: See Admin data.
5. Unauthorized Update:
   - Edit: `{"id":2, "email":"hackedbob@example.com"}`.
   - Click PUT – Updates Bob's profile.
   - Verify with GET.
6. Refresh – Stay logged in, try exploit again.
7. Invalid Test: `{"id":9999}` – "Not found" error.

### Step 5: Exploit via DevTools (Simulate Advanced Hacking)
1. Logged in, press F12 (DevTools) > Console tab.
2. Type: `document.getElementById('payload').value = '{"id":3}'` (Charlie's ID) > Enter.
3. Click a GET/PUT button – See/exploit Charlie's data.
4. Or Elements tab: Edit <textarea> inline.
5. This mimics real tools like Burp Suite for tampering requests.

### Step 6: Test Other Users and Logout
1. Click "Logout" – Back to login, session cleared (even on refresh).
2. Log in as Bob (ID 2) – See if prior hacks affected his profile.
3. Exploit back to Alice (id:1).
4. Log in as Admin – Exploit others.
5. Refresh after login – Persists.

### Step 7: Edge Cases
1. Invalid JSON: `{"id":1` (missing }) > Click button > "Invalid JSON payload".
2. No ID: `{"name":"test"}` > "Invalid payload".
3. No JWT: Console `currentJWT = null` > Button > "Unauthorized".
4. Clear Persistence: DevTools > Application > Local Storage > Delete "bola-lab-session" > Refresh > Back to login.

## Step-by-Step: How to Make This Less Vulnerable
To "fix" BOLA, add ownership checks in the simulation (mimicking server-side logic). This prevents exploits.

### Step 1: Understand the Fix
- Decode JWT to get user's "sub" (ID).
- Check if sub === requested id.
- If not, return "Forbidden".
- In real apps: Do this on server with jwt.verify().

### Step 2: Update script.js
Open `script.js`, find `simulateApi` function. Add this code after the `try { id = ... }` block:


###  javascript
```javascript
// Fake decode JWT (in real server: use jwt.verify(jwt, secret))
const jwtParts = jwt.split('.');
if (jwtParts.length !== 3) {
    return { error: 'Invalid JWT' };
}
let decodedPayload;
try {
    decodedPayload = JSON.parse(atob(jwtParts[1]));
} catch (e) {
    return { error: 'Invalid JWT payload' };
}

// FIX: Ownership check
if (decodedPayload.sub !== id) {
    return { error: 'Forbidden: You do not own this resource' };
}



### Testing the Fix: What Happens After Applying the Ownership Check

After adding the ownership check in `simulateApi()` (decoding the JWT and comparing `sub` to the requested `id`), the BOLA vulnerability is closed in this simulation.

### How to Test the Fixed Version Step-by-Step

1. **Apply the fix**  
   In `script.js`, inside the `simulateApi` function, **right after** the block where you parse and validate the `id` from payload, add:

   ```javascript
   // Fake decode JWT (in real server: use jwt.verify(jwt, secret))
   const jwtParts = jwt.split('.');
   if (jwtParts.length !== 3) {
       return { error: 'Invalid JWT' };
   }
   let decodedPayload;
   try {
       decodedPayload = JSON.parse(atob(jwtParts[1]));
   } catch (e) {
       return { error: 'Invalid JWT payload' };
   }

   // FIX: Ownership check – this stops BOLA
   if (decodedPayload.sub !== id) {
       return { error: 'Forbidden: You do not own this resource' };
   }
