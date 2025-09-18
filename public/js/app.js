// simple variables
let socket;
let authToken = localStorage.getItem("authToken");
let portfolioChart;

// base url
const API_BASE = "http://localhost:5000/api";

// init
document.addEventListener("DOMContentLoaded", function() {
  if (authToken) {
    showDashboard();
    connectSocket();
    loadPortfolio();
  } else {
    showLogin();
  }
});

// login
async function login() {
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;
  let errorDiv = document.getElementById("loginError");

  if (!email || !password) {
    showError(errorDiv, "Fill all fields");
    return;
  }

  try {
    let res = await fetch(API_BASE + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    let data = await res.json();

    if (data.success) {
      authToken = data.token;
      localStorage.setItem("authToken", authToken);
      showDashboard();
      connectSocket();
      loadPortfolio();
    } else {
      showError(errorDiv, data.message || "Login failed");
    }
  } catch (error) {
    showError(errorDiv, "Network error");
  }
}

// logout
function logout() {
  authToken = null;
  localStorage.removeItem("authToken");
  if (socket) socket.disconnect();
  showLogin();
}

// ui
function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden");
  document.getElementById("portfolioDashboard").classList.add("hidden");
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("loginBtn").classList.remove("hidden");
  document.getElementById("logoutBtn").classList.add("hidden");
}

function showDashboard() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("portfolioDashboard").classList.remove("hidden");
  document.getElementById("loading").classList.add("hidden");
  document.getElementById("loginBtn").classList.add("hidden");
  document.getElementById("logoutBtn").classList.remove("hidden");
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

// load portfolio
async function loadPortfolio() {
  try {
    let res = await fetch(API_BASE + "/portfolio/live", {
      headers: { Authorization: "Bearer " + authToken }
    });
    let data = await res.json();
    if (data.success) {
      updatePortfolioDisplay(data.portfolio);
    }
  } catch (e) {
    console.error("Error loading portfolio", e);
  }
}

function updatePortfolioDisplay(portfolio) {
  document.getElementById("totalValue").textContent = "$" + portfolio.currentValue;
  document.getElementById("totalInvestment").textContent = "$" + portfolio.totalInvestment;
  document.getElementById("totalPnL").textContent = "$" + portfolio.totalPnL;
  document.getElementById("totalPnLPercent").textContent = portfolio.totalPnLPercentage + "%";

  updatePortfolioTable(portfolio.positions);
  updatePortfolioChart(portfolio);
}

function updatePortfolioTable(positions) {
  let tbody = document.getElementById("portfolioTableBody");
  if (positions.length === 0) {
    tbody.innerHTML = "<tr><td colspan='9'>No stocks yet</td></tr>";
    return;
  }
  tbody.innerHTML = "";
  positions.forEach(p => {
    tbody.innerHTML += `
      <tr>
        <td>${p.symbol}</td>
        <td>${p.quantity}</td>
        <td>$${p.purchasePrice}</td>
        <td>$${p.currentPrice}</td>
        <td>$${p.investmentValue}</td>
        <td>$${p.currentValue}</td>
        <td>$${p.pnl}</td>
        <td>${p.pnlPercentage}%</td>
        <td><button onclick="removeStock('${p.symbol}')">Remove</button></td>
      </tr>
    `;
  });
}

function updatePortfolioChart(portfolio) {
  let ctx = document.getElementById("portfolioChart").getContext("2d");
  if (portfolioChart) portfolioChart.destroy();

  let labels = portfolio.positions.map(p => p.symbol);
  let values = portfolio.positions.map(p => p.currentValue);

  portfolioChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels: labels, datasets: [{ data: values }] },
    options: { plugins: { legend: { position: "bottom" } } }
  });
}

// sockets
function connectSocket() {
  if (!authToken) return;
  socket = io("http://localhost:5000", { auth: { token: authToken } });
  socket.on("portfolioUpdate", (data) => updatePortfolioDisplay(data));
}

// modal
function openAddStockModal() {
  document.getElementById("addStockModal").classList.add("active");
}
function closeAddStockModal() {
  document.getElementById("addStockModal").classList.remove("active");
}

// add stock
async function addStock() {
  let symbol = document.getElementById("stockSymbol").value.toUpperCase();
  let quantity = parseInt(document.getElementById("stockQuantity").value);
  let price = parseFloat(document.getElementById("stockPrice").value);

  try {
    let res = await fetch(API_BASE + "/portfolio/stock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + authToken
      },
      body: JSON.stringify({ symbol, quantity, purchasePrice: price })
    });
    let data = await res.json();
    if (data.success) {
      closeAddStockModal();
      loadPortfolio();
    } else {
      alert("Error adding stock");
    }
  } catch (e) {
    alert("Network error");
  }
}

async function removeStock(symbol) {
  let res = await fetch(API_BASE + "/portfolio/stock/" + symbol, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + authToken }
  });
  let data = await res.json();
  if (data.success) {
    loadPortfolio();
  } else {
    alert("Error removing stock");
  }
}