const searches=[

"1964 Oldsmobile 98",
"Milwaukee Tool Box",
"Snap-On Toolbox",
"Ford Bronco",
"Vintage Coca Cola Machine",
"Chevrolet C10",
"Nintendo Switch OLED",
"Honda Generator"

];

const fakeListings=[

{
title:"1964 Oldsmobile 98",
price:18500,
site:"Facebook Marketplace"
},

{
title:"1964 Oldsmobile Ninety-Eight",
price:19750,
site:"Craigslist"
},

{
title:"1964 Oldsmobile Holiday Sedan",
price:17900,
site:"eBay"
}

];

const bars={

ebayBar:0,
fbBar:0,
clBar:0,
ouBar:0

};

const ids=Object.keys(bars);

function sleep(ms){

return new Promise(r=>setTimeout(r,ms));

}

async function fillBar(id){

const bar=document.getElementById(id);

for(let i=0;i<=100;i++){

bar.style.width=i+"%";

await sleep(12+Math.random()*4);

}

}

async function typeText(text){

const box=document.getElementById("demoSearch");

box.value="";

for(const letter of text){

box.value+=letter;

await sleep(75);

}

}

function makeCard(item){

const card=document.createElement("div");

card.className="card";

card.innerHTML=`

<div class="left">

<div class="title">${item.title}</div>

<div class="marketplace">${item.site}</div>

</div>

<div class="price">$${item.price.toLocaleString()}</div>

`;

document.getElementById("results").appendChild(card);

setTimeout(()=>card.classList.add("show"),100);

}

async function demo(){

while(true){

document.getElementById("results").innerHTML="";

document.getElementById("statusText").textContent="";

ids.forEach(id=>{

document.getElementById(id).style.width="0%";

});

const search=searches[Math.floor(Math.random()*searches.length)];

await typeText(search);

document.getElementById("statusText").textContent="Searching marketplaces...";

await Promise.all(ids.map(fillBar));

document.getElementById("statusText").textContent="Removing duplicate listings...";

await sleep(1200);

document.getElementById("statusText").textContent="Ranking best matches...";

await sleep(1200);

document.getElementById("statusText").textContent="Displaying results";

await sleep(700);

for(const item of fakeListings){

makeCard(item);

await sleep(350);

}

await sleep(5000);

}

}

demo();
