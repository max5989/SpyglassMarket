const params = new URLSearchParams(window.location.search);
const query = (params.get("q") || "1964 Oldsmobile parts").trim();

const title = document.getElementById("results-title");
const summary = document.getElementById("results-summary");
const queryInput = document.getElementById("header-query");
const grid = document.getElementById("results-grid");
const emptyState = document.getElementById("empty-state");
const statusBox = document.getElementById("expedition-status");
const statusTitle = document.getElementById("status-title");
const statusMessage = document.getElementById("status-message");
const sortControl = document.getElementById("sort-results");
const clearFilters = document.getElementById("clear-filters");
const applyFilters = document.getElementById("apply-filters");
const externalButtons = document.getElementById("external-buttons");

document.getElementById("year").textContent =
  new Date().getFullYear();

if (queryInput) {
  queryInput.value = query;
}
document.title = `${query} | Spyglass Market`;
title.textContent = `Discoveries for “${query}”`;

// Public Cloudflare Worker backend
const API_BASE_URL =
  "https://spyglass-backend.millermax42.workers.dev";

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

function decodeHtmlEntities(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value ?? "");
  return textarea.value;
}

function normalizeMarketplaceItem(item, index, marketplace) {
  const source =
    marketplace === "etsy"
      ? "Etsy"
      : "eBay";

  const priceValue =
    item.price?.value ??
    item.price ??
    item.currentPrice?.value ??
    0;

  const shippingCost =
    item.shippingOptions?.[0]?.shippingCost?.value;

  let shipping = "Shipping details unavailable";

  if (marketplace === "etsy") {
    shipping = "View Etsy for shipping";
  } else if (Number(shippingCost) === 0) {
    shipping = "Free shipping";
  } else if (shippingCost !== undefined) {
    shipping =
      `$${Number(shippingCost).toFixed(2)} shipping`;
  }

  const image =
    typeof item.image === "string"
      ? item.image
      : item.image?.imageUrl ||
      item.thumbnailImages?.[0]?.imageUrl ||
      "spyglass-logo.png";

  const fallbackUrl =
    marketplace === "etsy"
      ? `https://www.etsy.com/search?q=${encodeURIComponent(query)}`
      : `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`;

  const itemUrl =
    item.itemUrl ||
    item.itemWebUrl ||
    item.itemAffiliateWebUrl ||
    item.url ||
    fallbackUrl;

  return {
    id:
      `${marketplace}-` +
      (item.itemId || item.id || index + 1),

    source,

    marketplace,

    title:
      decodeHtmlEntities(
        item.title ||
        `Untitled ${source} listing`
      ),

    price:
      Number(priceValue) || 0,

    currency:
      item.price?.currency || "USD",

    condition:
      item.condition ||
      (marketplace === "etsy"
        ? "Not specified by Etsy"
        : "Condition not listed"),

    shipping,

    daysAgo: index,

    image,

    url: itemUrl
  };
}

function formatPrice(item) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: item.currency || "USD"
    }).format(item.price);
  } catch {
    return `$${item.price.toFixed(2)}`;
  }
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
          aria-label="${saved ? "Remove saved listing" : "Save listing"}"
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
          ${escapeHtml(formatPrice(item))}
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
            View on ${escapeHtml(item.source)}
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

    const imageElement = card.querySelector("img");

    imageElement.addEventListener("error", () => {
      imageElement.src = "spyglass-logo.png";
    }, { once: true });

    grid.appendChild(card);
  });

  const resultWord =
    list.length === 1
      ? "discovery"
      : "discoveries";

  summary.textContent =
    `${list.length} ${resultWord} found for “${query}”.`;
}

function sortItems() {
  const sorted = [...currentItems];

  if (sortControl.value === "low") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sortControl.value === "high") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (sortControl.value === "newest") {
    sorted.sort((a, b) => a.daysAgo - b.daysAgo);
  }

  render(sorted);
}

function conditionMatchesFilter(itemCondition, filters) {
  if (filters.length === 0) {
    return true;
  }

  const condition = itemCondition.toLowerCase();

  return filters.some(filter => {
    const selected = filter.toLowerCase();

    if (selected === "for parts") {
      return condition.includes("for parts");
    }

    return condition.includes(selected);
  });
}

applyFilters.addEventListener("click", () => {
  const conditions = [
    ...document.querySelectorAll(
      'input[name="condition"]:checked'
    )
  ].map(input => input.value);

  const marketplaces = [
    ...document.querySelectorAll(
      'input[name="marketplace"]:checked'
    )
  ].map(input => input.value.toLowerCase());

  const min =
    Number(
      document.getElementById("min-price").value || 0
    );

  const maxValue =
    document.getElementById("max-price").value;

  const max =
    maxValue === ""
      ? Infinity
      : Number(maxValue);

  currentItems = allItems.filter(item => {
    const matchesCondition =
      conditionMatchesFilter(
        item.condition,
        conditions
      );

    const matchesMarketplace =
      marketplaces.includes(item.marketplace.toLowerCase());

    const matchesPrice =
      item.price >= min &&
      item.price <= max;

    return (
      matchesCondition &&
      matchesMarketplace &&
      matchesPrice
    );
  });

  sortItems();
});

clearFilters.addEventListener("click", () => {
  document
    .querySelectorAll(
      'input[name="condition"], input[name="marketplace"]'
    )
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
  const saveButton =
    event.target.closest("[data-save]");

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
    saveButton.setAttribute(
      "aria-label",
      isSaved
        ? "Remove saved listing"
        : "Save listing"
    );
  }

  const copyButton =
    event.target.closest("[data-copy]");

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
    "Search Etsy",
    `https://www.etsy.com/search?q=${encodeURIComponent(query)}`
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

async function fetchMarketplace(path, marketplace) {
  const response = await fetch(
    `${API_BASE_URL}${path}?q=${encodeURIComponent(query)}`
  );

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(
      data.error ||
      `${marketplace} returned status ${response.status}`
    );
  }

  const rawItems =
    data.items ||
    data.results ||
    data.itemSummaries ||
    data.data?.itemSummaries ||
    [];

  return rawItems.map((item, index) =>
    normalizeMarketplaceItem(
      item,
      index,
      marketplace
    )
  );
}

async function loadResults() {
  statusTitle.textContent =
    "Scanning eBay and Etsy…";

  statusMessage.textContent =
    `Looking for “${query}”.`;

  const results = await Promise.allSettled([
    fetchMarketplace(
      "/api/ebay/search",
      "ebay"
    ),
    fetchMarketplace(
      "/api/etsy/search",
      "etsy"
    )
  ]);

  const ebayItems =
    results[0].status === "fulfilled"
      ? results[0].value
      : [];

  const etsyItems =
    results[1].status === "fulfilled"
      ? results[1].value
      : [];

  if (results[0].status === "rejected") {
    console.error(
      "eBay search failed:",
      results[0].reason
    );
  }

  if (results[1].status === "rejected") {
    console.error(
      "Etsy search failed:",
      results[1].reason
    );
  }

  allItems = [
    ...ebayItems,
    ...etsyItems
  ];

  currentItems = [...allItems];

  if (allItems.length === 0) {
    statusTitle.textContent =
      "Search interrupted";

    statusMessage.textContent =
      "Spyglass could not reach either marketplace.";

    summary.textContent =
      "Unable to load marketplace results. Please try again shortly.";

    grid.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  statusTitle.textContent = "Expedition ready";

  statusMessage.textContent =
    `${ebayItems.length} eBay and ` +
    `${etsyItems.length} Etsy discoveries cataloged.`;

  render(currentItems);

  setTimeout(() => {
    statusBox.classList.add("complete");
  }, 550);
}

loadResults();