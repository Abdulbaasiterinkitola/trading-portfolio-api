const statusDiv = document.getElementById("status");
const actionsDiv = document.querySelector(".actions");
const liveOutput = document.getElementById("liveOutput");

function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? "red" : "green";
}

function getToken() {
  return localStorage.getItem("token");
}
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("regUsername").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  try {
    const res = await fetch("/api/auth/register", {
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

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch("/api/auth/login", {
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

document.getElementById("addStockForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = getToken();
  if (!token) return showStatus("❌ You must login first", true);

  const symbol = document.getElementById("stockSymbol").value;
  const quantity = parseInt(document.getElementById("stockQuantity").value, 10);

  try {
    const res = await fetch("/api/portfolio/stock", {
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

document.getElementById("removeStockForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = getToken();
  if (!token) return showStatus("❌ You must login first", true);

  const symbol = document.getElementById("removeSymbol").value;

  try {
    const res = await fetch(`/api/portfolio/stock/${symbol}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    showStatus(data.success ? "✅ Stock removed!" : "❌ " + data.message, !data.success);
  } catch {
    showStatus("❌ Error removing stock", true);
  }
});


document.getElementById("loadLive").addEventListener("click", async () => {
  const token = getToken();
  if (!token) return showStatus("❌ You must login first", true);

  try {
    const res = await fetch("/api/portfolio/live", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      renderPortfolio(data);
      showStatus("✅ Live portfolio loaded!");
    } else {
      liveOutput.innerHTML = `<p style="color:red;">❌ ${data.message}</p>`;
    }
  } catch {
    showStatus("❌ Error fetching live portfolio", true);
  }
});

function renderPortfolio(portfolio) {
  let html = `
    <h3>Portfolio Summary</h3>
    <p><strong>Total Value:</strong> $${portfolio.totalValue.toFixed(2)}</p>
    <p><strong>Total Invested:</strong> $${portfolio.totalInvested.toFixed(2)}</p>
    <p><strong>Profit/Loss:</strong> $${portfolio.profitLoss.toFixed(2)} (${portfolio.profitLossPercent.toFixed(2)}%)</p>
    <p><strong>Stocks Count:</strong> ${portfolio.stockCount}</p>

    <h3>Positions</h3>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-top:10px;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th>Symbol</th>
          <th>Quantity</th>
          <th>Avg Cost</th>
          <th>Current Price</th>
          <th>Investment Value</th>
          <th>Current Value</th>
          <th>P/L</th>
          <th>P/L %</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (portfolio.positions && portfolio.positions.length > 0) {
    portfolio.positions.forEach(p => {
      html += `
        <tr>
          <td>${p.symbol}</td>
          <td>${p.quantity}</td>
          <td>$${p.avgCost.toFixed(2)}</td>
          <td>$${p.currentPrice.toFixed(2)}</td>
          <td>$${p.investmentValue.toFixed(2)}</td>
          <td>$${p.currentValue.toFixed(2)}</td>
          <td>$${p.profitLoss.toFixed(2)}</td>
          <td>${p.profitLossPercent.toFixed(2)}%</td>
        </tr>
      `;
    });
  } else {
    html += `<tr><td colspan="8">No stocks yet</td></tr>`;
  }

  html += `</tbody></table>`;
  liveOutput.innerHTML = html;
}