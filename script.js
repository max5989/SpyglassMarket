"use strict";


const searches = [
    "antique brass telescope",
    "1964 Oldsmobile parts",
    "vintage record player",
    "used woodworking tools",
    "classic travel trailer",
    "antique oak desk"
    "testicle rejuvination cream"
];


const marketplaceSequence = [
    {
        key: "ebay",
        label: "eBay",
        found: [126, 310]
    },
    {
        key: "facebook",
        label: "Facebook Marketplace",
        found: [74, 230]
    },
    {
        key: "craigslist",
        label: "Craigslist",
        found: [28, 115]
    },
    {
        key: "offerup",
        label: "OfferUp",
        found: [40, 160]
    }
];


const demoResults = [
    {
        title: "Vintage Brass Telescope with Leather Grip",
        marketplace: "eBay",
        price: "$149"
    },
    {
        title: "Antique Maritime Spyglass",
        marketplace: "Facebook Marketplace",
        price: "$95"
    },
    {
        title: "Collapsible Brass Explorer Telescope",
        marketplace: "Craigslist",
        price: "$120"
    }
];


const searchInput = document.getElementById("demoSearch");
const liveStatus = document.getElementById("liveStatus");
const resultsPanel = document.getElementById("liveResults");


function wait(milliseconds) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, milliseconds);
    });
}


function randomNumber(minimum, maximum) {
    return Math.floor(
        Math.random() * (maximum - minimum + 1)
    ) + minimum;
}


function getNode(marketKey) {
    return document.querySelector(
        `[data-market="${marketKey}"]`
    );
}


function getLine(marketKey) {
    return document.getElementById(`line-${marketKey}`);
}


function clearMarketplaceStates() {
    document.querySelectorAll(".market-node").forEach((node) => {
        node.classList.remove("active");

        const status = node.querySelector(".market-status");

        if (status) {
            status.textContent = "Standing by";
        }
    });

    document.querySelectorAll(".connections line").forEach((line) => {
        line.classList.remove("active");
    });
}


function clearResults() {
    resultsPanel.replaceChildren();
}


async function typeSearch(text) {
    searchInput.value = "";

    for (const character of text) {
        searchInput.value += character;

        await wait(58 + Math.random() * 42);
    }
}


function createResultCard(result, delay) {
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const market = document.createElement("p");
    const price = document.createElement("p");

    card.className = "result-card";
    card.style.animationDelay = `${delay}ms`;

    title.className = "result-title";
    title.textContent = result.title;

    market.className = "result-market";
    market.textContent = result.marketplace;

    price.className = "result-price";
    price.textContent = result.price;

    card.append(title, market, price);

    resultsPanel.appendChild(card);
}


function drawConnection(line, node, logo) {
    if (!line || !node || !logo) {
        return;
    }

    const network = document.querySelector(".network-demo");

    if (!network) {
        return;
    }

    const networkRect = network.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const logoRect = logo.getBoundingClientRect();

    const startX =
        nodeRect.left +
        nodeRect.width / 2 -
        networkRect.left;

    const startY =
        nodeRect.top +
        nodeRect.height / 2 -
        networkRect.top;

    const endX =
        logoRect.left +
        logoRect.width / 2 -
        networkRect.left;

    const endY =
        logoRect.top +
        logoRect.height / 2 -
        networkRect.top;

    line.setAttribute("x1", String(startX));
    line.setAttribute("y1", String(startY));
    line.setAttribute("x2", String(endX));
    line.setAttribute("y2", String(endY));
}


function updateConnectionLines() {
    const logo = document.querySelector(".central-logo");

    marketplaceSequence.forEach((market) => {
        drawConnection(
            getLine(market.key),
            getNode(market.key),
            logo
        );
    });
}


async function searchMarketplace(market) {
    const node = getNode(market.key);
    const line = getLine(market.key);

    if (!node) {
        return 0;
    }

    const status = node.querySelector(".market-status");

    node.classList.add("active");

    if (line) {
        line.classList.add("active");
    }

    if (status) {
        status.textContent = "Searching the listings...";
    }

    liveStatus.textContent =
        `Exploring ${market.label} for promising matches...`;

    await wait(950 + Math.random() * 500);

    const count = randomNumber(
        market.found[0],
        market.found[1]
    );

    if (status) {
        status.textContent =
            `✓ ${count.toLocaleString()} listings discovered`;
    }

    liveStatus.textContent =
        `${market.label} returned ` +
        `${count.toLocaleString()} possible matches.`;

    await wait(650);

    node.classList.remove("active");

    if (line) {
        line.classList.remove("active");
    }

    return count;
}


async function runSearchDemo() {
    while (true) {
        clearMarketplaceStates();
        clearResults();

        const query =
            searches[
                Math.floor(Math.random() * searches.length)
            ];

        liveStatus.textContent =
            "Choosing a new search expedition...";

        await wait(700);

        await typeSearch(query);

        liveStatus.textContent =
            `Charting a course for “${query}”...`;

        await wait(900);

        let totalListings = 0;

        for (const market of marketplaceSequence) {
            totalListings += await searchMarketplace(market);
        }

        liveStatus.textContent =
            "Comparing prices and removing repeated listings...";

        await wait(1300);

        const uniqueListings = Math.floor(
            totalListings * (0.7 + Math.random() * 0.13)
        );

        liveStatus.textContent =
            `${uniqueListings.toLocaleString()} unique listings remain. ` +
            "Selecting the most promising discoveries...";

        await wait(1200);

        demoResults.forEach((result, index) => {
            createResultCard(result, index * 230);
        });

        liveStatus.textContent =
            "Search complete — the finest matches have been gathered.";

        await wait(6500);
    }
}


window.addEventListener("resize", updateConnectionLines);


window.addEventListener("load", () => {
    updateConnectionLines();

    window.setTimeout(updateConnectionLines, 400);

    runSearchDemo().catch((error) => {
        console.error("Search demonstration failed:", error);

        liveStatus.textContent =
            "The search demonstration could not be started.";
    });
});
