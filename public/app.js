const statusDiv = document.getElementById("status");
const actionsDiv = document.querySelector(".actions");
const liveOutput = document.getElementById("liveOutput");

// ✅ Point to local backend if running locally, else Render backend
const API_BASE_URL = window.location.hostname.includes("localhost") 
  ? "http://localhost:3000"
  : "https://portfolio-tracker-i9ca.onrender.com/";

function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? "red" : "green";
}

function getToken() {
  return localStorage.getItem("token");
}

// --- Register ---
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("regUsername").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (data.success) {
      showStatus("✅ Registered successfully, now login!");
    } else {
      showStatus("❌ " + data.message, true);
    }
  } catch {
    showStatus("❌ Error registering", true);
  }
});

// --- Login ---
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem("token", data.token);
      showStatus("✅ Logged in successfully, token saved!");
      actionsDiv.style.display = "block";
    } else {
      showStatus("❌ " + data.message, true);
    }
  } catch {
    showStatus("❌ Error logging in", true);
  }
});

// --- Add Stock ---
document.getElementById("addStockForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = getToken();
  if (!token) return showStatus("❌ You must login first", true);

  const symbol = document.getElementById("stockSymbol").value;
  const quantity = parseInt(document.getElementById("stockQuantity").value, 10);

  try {
    const res = await fetch(`${API_BASE_URL}/api/portfolio/stock`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ symbol, quantity }),
    });
    const data = await res.json();
    showStatus(data.success ? "✅ Stock added!" : "❌ " + data.message, !data.success);
  } catch {
    showStatus("❌ Error adding stock", true);
  }
});

// --- Remove Stock ---
document.getElementById("removeStockForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = getToken();
  if (!token) return showStatus("❌ You must login first", true);

  const symbol = document.getElementById("removeSymbol").value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/portfolio/stock/${symbol}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    showStatus(data.success ? "✅ Stock removed!" : "❌ " + data.message, !data.success);
  } catch {
    showStatus("❌ Error removing stock", true);
  }
});

// --- Live Portfolio ---
document.getElementById("loadLive").addEventListener("click", async () => {
  const token = getToken();
  if (!token) return showStatus("❌ You must login first", true);

  try {
    const res = await fetch(`${API_BASE_URL}/api/portfolio/live`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    liveOutput.textContent = JSON.stringify(data, null, 2);
    showStatus("✅ Live portfolio loaded!");
  } catch {
    showStatus("❌ Error fetching live portfolio", true);
  }
});