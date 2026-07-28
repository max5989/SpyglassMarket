const params = new URLSearchParams(window.location.search);
const query = (params.get("q") || "1964 Oldsmobile parts").trim();

const title = document.getElementById("results-title");
const summary = document.getElementById("results-summary");
const queryInput = document.getElementById("results-query");
const grid = document.getElementById("results-grid");
const emptyState = document.getElementById("empty-state");
const statusBox = document.getElementById("expedition-status");
const statusTitle = document.getElementById("status-title");
const statusMessage = document.getElementById("status-message");
const sortControl = document.getElementById("sort-results");
const clearFilters = document.getElementById("clear-filters");
const applyFilters = document.getElementById("apply-filters");
const externalButtons = document.getElementById("external-buttons");

document.getElementById("year").textContent = new Date().getFullYear();

queryInput.value = query;
document.title = `${query} | Spyglass Market`;
title.textContent = `Discoveries for “${query}”`;

// The backend currently runs locally on port 3000.
const API_BASE_URL = "http://localhost:3000";

let allItems = [];
let currentItems = [];

function savedItems() {
  try {
    return JSON.parse(
      localStorage.getItem("spyglassSavedItems") || "[]"
    );
  } catch {
    return [];
  }
}

function setSaved(saved) {
  localStorage.setItem(
    "spyglassSavedItems",
    JSON.stringify(saved)
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeEbayItem(item, index) {
  const priceValue =
    item.price?.value ??
    item.price ??
    item.currentPrice?.value ??
    0;

  const shippingCost =
    item.shippingOptions?.[0]?.shippingCost?.value;

  let shipping = "Shipping details unavailable";

  if (Number(shippingCost) === 0) {
    shipping = "Free shipping";
  } else if (shippingCost !== undefined) {
    shipping = `$${Number(shippingCost).toFixed(2)} shipping`;
  }

  return {
    id:
      item.itemId ||
      item.id ||
      `ebay-${index + 1}`,

    source: "eBay",

    title:
      item.title ||
      "Untitled eBay listing",

    price:
      Number(priceValue) || 0,

    condition:
      item.condition ||
      "Condition not listed",

    shipping,

    daysAgo: index,

    image:
      item.image?.imageUrl ||
      item.thumbnailImages?.[0]?.imageUrl ||
      "spyglass-logo.png",

    url:
      item.itemWebUrl ||
      item.itemAffiliateWebUrl ||
      item.url ||
      `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`
  };
}

function render(list) {
  grid.innerHTML = "";
  emptyState.hidden = list.length !== 0;

  list.forEach(item => {
    const saved = savedItems().includes(item.id);
    const card = document.createElement("article");

    card.className = "result-card";

    card.innerHTML = `
      <div class="result-image">
        <span class="source-badge">
          ${escapeHtml(item.source)}
        </span>

        <button
          class="favorite-button ${saved ? "saved" : ""}"
          type="button"
          data-save="${escapeHtml(item.id)}"
          aria-label="Save listing"
        >
          ${saved ? "♥" : "♡"}
        </button>

        <img
          src="${escapeHtml(item.image)}"
          alt="${escapeHtml(item.title)}"
          loading="lazy"
        >
      </div>

      <div class="result-body">
        <h2 class="result-title">
          ${escapeHtml(item.title)}
        </h2>

        <p class="result-price">
          $${item.price.toFixed(2)}
        </p>

        <div class="result-meta">
          <span>${escapeHtml(item.condition)}</span>
          <span>${escapeHtml(item.shipping)}</span>
        </div>

        <div class="result-actions">
          <a
            href="${escapeHtml(item.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on eBay
          </a>

          <button
            type="button"
            data-copy="${escapeHtml(item.url)}"
          >
            Copy Link
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  const resultWord = list.length === 1 ? "discovery" : "discoveries";

  summary.textContent =
    `${list.length} ${resultWord} found for “${query}”.`;
}

function sortItems() {
  const sorted = [...currentItems];

  if (sortControl.value === "low") {
    sorted.sort((a, b) => a.price - b.price);
  }

  if (sortControl.value === "high") {
    sorted.sort((a, b) => b.price - a.price);
  }

  if (sortControl.value === "newest") {
    sorted.sort((a, b) => a.daysAgo - b.daysAgo);
  }

  render(sorted);
}

applyFilters.addEventListener("click", () => {
  const conditions = [
    ...document.querySelectorAll(
      'input[name="condition"]:checked'
    )
  ].map(input => input.value);

  const min =
    Number(document.getElementById("min-price").value || 0);

  const maxValue =
    document.getElementById("max-price").value;

  const max =
    maxValue === ""
      ? Infinity
      : Number(maxValue);

  currentItems = allItems.filter(item => {
    const conditionMatches =
      conditions.length === 0 ||
      conditions.includes(item.condition);

    const priceMatches =
      item.price >= min &&
      item.price <= max;

    return conditionMatches && priceMatches;
  });

  sortItems();
});

clearFilters.addEventListener("click", () => {
  document
    .querySelectorAll('input[name="condition"]')
    .forEach(input => {
      input.checked = false;
    });

  document.getElementById("min-price").value = "";
  document.getElementById("max-price").value = "";

  currentItems = [...allItems];
  sortControl.value = "best";

  render(currentItems);
});

sortControl.addEventListener("change", sortItems);

document.addEventListener("click", async event => {
  const saveButton = event.target.closest("[data-save]");

  if (saveButton) {
    const id = saveButton.dataset.save;
    const current = savedItems();

    const next = current.includes(id)
      ? current.filter(savedId => savedId !== id)
      : [...current, id];

    setSaved(next);

    const isSaved = next.includes(id);

    saveButton.classList.toggle("saved", isSaved);
    saveButton.textContent = isSaved ? "♥" : "♡";
  }

  const copyButton = event.target.closest("[data-copy]");

  if (copyButton) {
    try {
      await navigator.clipboard.writeText(
        copyButton.dataset.copy
      );

      copyButton.textContent = "Copied";

      setTimeout(() => {
        copyButton.textContent = "Copy Link";
      }, 1200);
    } catch {
      copyButton.textContent = "Copy failed";
    }
  }
});

[
  [
    "Search eBay",
    `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`
  ],
  [
    "Search Facebook Marketplace",
    `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`
  ],
  [
    "Search Craigslist",
    `https://www.craigslist.org/search/sss?query=${encodeURIComponent(query)}`
  ],
  [
    "Search OfferUp",
    `https://offerup.com/search?q=${encodeURIComponent(query)}`
  ]
].forEach(([name, url]) => {
  const link = document.createElement("a");

  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = name;

  externalButtons.appendChild(link);
});

async function loadResults() {
  try {
    statusTitle.textContent = "Scanning eBay…";
    statusMessage.textContent =
      `Looking for “${query}”.`;

    const response = await fetch(
      `${API_BASE_URL}/ebay/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(
        `Backend returned status ${response.status}`
      );
    }

    const data = await response.json();

    /*
      This supports several common response shapes:

      { items: [...] }
      { results: [...] }
      { itemSummaries: [...] }
      { data: { itemSummaries: [...] } }
    */
    const rawItems =
      data.items ||
      data.results ||
      data.itemSummaries ||
      data.data?.itemSummaries ||
      [];

    allItems = rawItems.map(normalizeEbayItem);
    currentItems = [...allItems];

    statusTitle.textContent = "Expedition ready";
    statusMessage.textContent =
      `${allItems.length} eBay discoveries cataloged.`;

    render(currentItems);

    setTimeout(() => {
      statusBox.classList.add("complete");
    }, 550);
  } catch (error) {
    console.error("Spyglass search failed:", error);

    statusTitle.textContent = "Search interrupted";
    statusMessage.textContent =
      "Spyglass could not reach the search server.";

    summary.textContent =
      "Unable to load eBay results. Make sure the backend is running.";

    grid.innerHTML = "";
    emptyState.hidden = false;
  }
}

loadResults();