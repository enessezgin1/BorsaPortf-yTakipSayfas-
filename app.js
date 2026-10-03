// Bu dosya sitenin davranışlarını yönetir: kayıt, fiyat sorgusu ve hesaplama.
const STORAGE_KEY = "benim-borsa-portfoyum-v1";
const currency = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });

let portfolio = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const list = document.querySelector("#portfolio-list");
const form = document.querySelector("#stock-form");
const message = document.querySelector("#form-message");

function savePortfolio() { localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio)); }
function formatMoney(value) { return currency.format(value || 0); }
function formatDate(date) { return date ? new Date(`${date}T00:00:00`).toLocaleDateString("tr-TR") : "Belirtilmedi"; }

function render() {
  list.innerHTML = "";
  if (!portfolio.length) {
    list.innerHTML = '<div class="empty">Portföyün henüz boş. Yukarıdaki formdan ilk hissenizi ekleyin.</div>';
    updateSummary();
    return;
  }
  const template = document.querySelector("#stock-card-template");
  portfolio.forEach((stock) => {
    const card = template.content.cloneNode(true);
    card.querySelector(".stock-symbol").textContent = stock.symbol;
    card.querySelector(".buy-info").textContent = `${number.format(stock.quantity)} adet · ${formatMoney(stock.buyPrice)}`;
    card.querySelector(".buy-date-info").textContent = formatDate(stock.buyDate);
    const priceNode = card.querySelector(".current-price");
    const profitNode = card.querySelector(".profit-loss");
    const statusNode = card.querySelector(".card-status");
    if (stock.currentPrice) {
      const profit = (stock.currentPrice - stock.buyPrice) * stock.quantity;
      priceNode.textContent = formatMoney(stock.currentPrice);
      profitNode.textContent = formatMoney(profit);
      profitNode.classList.add(profit >= 0 ? "positive" : "negative");
      statusNode.textContent = `Getiri oranı: %${number.format((profit / (stock.buyPrice * stock.quantity)) * 100)}`;
    } else {
      priceNode.textContent = "Girilmedi";
      statusNode.textContent = "Son fiyat girildiğinde hesaplanır.";
    }
    card.querySelector(".delete-button").addEventListener("click", () => {
      portfolio = portfolio.filter((item) => item.id !== stock.id);
      savePortfolio(); render();
    });
    card.querySelector(".price-update-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = card.querySelector(".price-update-input");
      const newPrice = Number(input.value.replace(",", "."));
      if (!Number.isFinite(newPrice) || newPrice <= 0) return;
      stock.currentPrice = newPrice;
      savePortfolio();
      render();
    });
    list.append(card);
  });
  updateSummary();
}

function updateSummary() {
  const cost = portfolio.reduce((sum, item) => sum + item.buyPrice * item.quantity, 0);
  const value = portfolio.reduce((sum, item) => sum + (item.currentPrice || 0) * item.quantity, 0);
  document.querySelector("#total-cost").textContent = formatMoney(cost);
  document.querySelector("#total-value").textContent = formatMoney(value);
  const profit = value - cost;
  const profitNode = document.querySelector("#total-profit");
  profitNode.textContent = formatMoney(profit);
  profitNode.className = profit >= 0 ? "positive" : "negative";
}

form.addEventListener("submit", (event) => {
  event.preventDefault(); message.textContent = "";
  const symbol = document.querySelector("#symbol").value.trim().toLocaleUpperCase("tr-TR");
  const quantity = Number(document.querySelector("#quantity").value);
  const buyPrice = Number(document.querySelector("#buy-price").value.replace(",", "."));
  const buyDate = document.querySelector("#buy-date").value;
  const currentPrice = Number(document.querySelector("#current-price-input").value.replace(",", "."));
  if (!symbol || quantity <= 0 || buyPrice <= 0 || !buyDate || currentPrice <= 0) { message.textContent = "Lütfen tüm alanları doğru doldurun."; return; }
  if (portfolio.some((stock) => stock.symbol === symbol)) { message.textContent = "Bu hisse zaten portföyde. Önce silip güncelleyebilirsiniz."; return; }
  portfolio.push({ id: crypto.randomUUID(), symbol, quantity, buyPrice, buyDate, currentPrice });
  savePortfolio(); form.reset(); render();
});
render();
