const nodes=[
"ebay",
"facebook",
"craigslist",
"offerup"
];


const messages=[

"Connecting to marketplaces...",
"Searching listings...",
"Comparing prices...",
"Removing duplicate listings...",
"Ranking best matches...",
"Complete!"

];


const results=[

"1964 Oldsmobile 98 - $18,500 - Facebook Marketplace",

"1964 Oldsmobile Holiday Sedan - $19,750 - eBay",

"1964 Oldsmobile Ninety-Eight - $17,900 - Craigslist"

];


function sleep(ms){

return new Promise(r=>setTimeout(r,ms));

}



async function runSearch(){


while(true){


document.querySelectorAll(".node")
.forEach(n=>n.classList.remove("active"));


document.getElementById("liveResults").innerHTML="";


for(let msg of messages.slice(0,5)){

document.getElementById("liveStatus").innerText=msg;


let randomNode=
nodes[Math.floor(Math.random()*nodes.length)];


document.querySelector("." + randomNode)
.classList.add("active");


await sleep(1200);


document.querySelector("." + randomNode)
.classList.remove("active");


}



document.getElementById("liveStatus").innerText=
"✓ Search complete";


await sleep(800);



results.forEach((r,i)=>{

setTimeout(()=>{

let div=document.createElement("div");

div.className="result";

div.innerText=r;

document
.getElementById("liveResults")
.appendChild(div);


},i*500);


});



await sleep(6000);


}


}


runSearch();
