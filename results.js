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

const templates = [
  ["Original Vintage Part",84.99,"Used","Free shipping",1],
  ["Restored Assembly",149.50,"Used","$18.40 shipping",4],
  ["New Replacement Kit",42.95,"New","Free shipping",2],
  ["OEM Hardware Lot",29.00,"Used","$7.95 shipping",8],
  ["Repairable Parts Lot",37.75,"For parts","Local pickup",6],
  ["Rare Dealer Stock Item",219.99,"New","$12.00 shipping",3],
  ["Chrome Trim and Brackets",67.40,"Used","Free shipping",11],
  ["Service Manual and Diagram Set",24.95,"Used","$5.25 shipping",5],
  ["Complete Project Bundle",325.00,"For parts","Freight quote",9]
];

const items = templates.map((t,i)=>({
  id:`demo-${i+1}`,
  source:"eBay",
  title:`${query} — ${t[0]}`,
  price:t[1],
  condition:t[2],
  shipping:t[3],
  daysAgo:t[4],
  image:"spyglass-logo.png",
  url:`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`
}));

let currentItems=[...items];

function savedItems(){
  try { return JSON.parse(localStorage.getItem("spyglassSavedItems")||"[]"); }
  catch { return []; }
}
function setSaved(saved){ localStorage.setItem("spyglassSavedItems",JSON.stringify(saved)); }

function render(list){
  grid.innerHTML="";
  emptyState.hidden=list.length!==0;
  list.forEach(item=>{
    const saved=savedItems().includes(item.id);
    const card=document.createElement("article");
    card.className="result-card";
    card.innerHTML=`
      <div class="result-image">
        <span class="source-badge">${item.source}</span>
        <button class="favorite-button ${saved?"saved":""}" type="button" data-save="${item.id}" aria-label="Save listing">${saved?"♥":"♡"}</button>
        <img src="${item.image}" alt="">
      </div>
      <div class="result-body">
        <h2 class="result-title">${item.title}</h2>
        <p class="result-price">$${item.price.toFixed(2)}</p>
        <div class="result-meta"><span>${item.condition}</span><span>${item.shipping}</span></div>
        <div class="result-actions">
          <a href="${item.url}" target="_blank" rel="noopener noreferrer">Search on eBay</a>
          <button type="button" data-copy="${item.url}">Copy Link</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
  summary.textContent=`${list.length} demo discoveries prepared for your search.`;
}

function sortItems(){
  const sorted=[...currentItems];
  if(sortControl.value==="low") sorted.sort((a,b)=>a.price-b.price);
  if(sortControl.value==="high") sorted.sort((a,b)=>b.price-a.price);
  if(sortControl.value==="newest") sorted.sort((a,b)=>a.daysAgo-b.daysAgo);
  render(sorted);
}

applyFilters.addEventListener("click",()=>{
  const conditions=[...document.querySelectorAll('input[name="condition"]:checked')].map(i=>i.value);
  const min=Number(document.getElementById("min-price").value||0);
  const maxValue=document.getElementById("max-price").value;
  const max=maxValue===""?Infinity:Number(maxValue);
  currentItems=items.filter(item=>(conditions.length===0||conditions.includes(item.condition))&&item.price>=min&&item.price<=max);
  sortItems();
});

clearFilters.addEventListener("click",()=>{
  document.querySelectorAll('input[name="condition"]').forEach(i=>i.checked=false);
  document.getElementById("min-price").value="";
  document.getElementById("max-price").value="";
  currentItems=[...items];
  sortControl.value="best";
  render(currentItems);
});

sortControl.addEventListener("change",sortItems);

document.addEventListener("click",async event=>{
  const save=event.target.closest("[data-save]");
  if(save){
    const id=save.dataset.save;
    const current=savedItems();
    const next=current.includes(id)?current.filter(x=>x!==id):[...current,id];
    setSaved(next);
    save.classList.toggle("saved");
    save.textContent=next.includes(id)?"♥":"♡";
  }
  const copy=event.target.closest("[data-copy]");
  if(copy){
    try{
      await navigator.clipboard.writeText(copy.dataset.copy);
      copy.textContent="Copied";
      setTimeout(()=>copy.textContent="Copy Link",1200);
    }catch{
      copy.textContent="Copy failed";
    }
  }
});

[
  ["Search eBay",`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`],
  ["Search Facebook Marketplace",`https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}`],
  ["Search Craigslist",`https://www.craigslist.org/search/sss?query=${encodeURIComponent(query)}`],
  ["Search OfferUp",`https://offerup.com/search?q=${encodeURIComponent(query)}`]
].forEach(([name,url])=>{
  const link=document.createElement("a");
  link.href=url;
  link.target="_blank";
  link.rel="noopener noreferrer";
  link.textContent=name;
  externalButtons.appendChild(link);
});

[
  ["Opening the map…","Preparing marketplace routes."],
  ["Scanning eBay…",`Looking for “${query}”.`],
  ["Cataloging discoveries…","Organizing prices, conditions, and shipping."],
  ["Expedition ready","Your results are prepared."]
].forEach(([heading,message],index)=>{
  setTimeout(()=>{
    statusTitle.textContent=heading;
    statusMessage.textContent=message;
    if(index===3){
      render(items);
      setTimeout(()=>statusBox.classList.add("complete"),550);
    }
  },index*650);
});
