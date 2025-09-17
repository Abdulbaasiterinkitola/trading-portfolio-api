const statusDiv = document.getElementById("status");
const actionsDiv = document.querySelector(".actions");
// const portfolioOutput = document.getElementById("portfolioOutput");
// const dashboardOutput = document.getElementById("dashboardOutput");
const liveOutput = document.getElementById("liveOutput");

function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? "red" : "green";
}

function getToken() {
  return localStorage.getItem("token");
}

// --- API Base URL ---
const API_BASE_URL = window.location.origin.includes("localhost")
  ? "http://localhost:3000/api"
  : "https://your-backend-service.onrender.com/api";

// --- Register ---
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("regUsername").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
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
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem("token", data.token);
      showStatus("✅ Logged in successfully, token saved!");
      actionsDiv.style.display = "block";

      // connect socket after login
      connectSocket(data.token);
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
    const res = await fetch(`${API_BASE_URL}/portfolio/stock`, {
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
    const res = await fetch(`${API_BASE_URL}/portfolio/stock/${symbol}`, {
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
    const res = await fetch(`${API_BASE_URL}/portfolio/live`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    liveOutput.textContent = JSON.stringify(data, null, 2);
    showStatus("✅ Live portfolio loaded!");
  } catch {
    showStatus("❌ Error fetching live portfolio", true);
  }
});

// --- Socket.IO setup ---
function connectSocket(token) {
  import("https://cdn.socket.io/4.7.2/socket.io.esm.min.js").then(({ io }) => {
    const socket = io(API_BASE_URL.replace("/api", ""), {
      auth: { token },
      transports: ["websocket"]
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server:", socket.id);
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });

    socket.on("portfolio_update", (update) => {
      liveOutput.textContent = JSON.stringify(update, null, 2);
      showStatus("📈 Live portfolio updated!");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  });
}