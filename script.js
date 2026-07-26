const input = document.getElementById("search-input");
const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

const placeholders = [
  "1964 Oldsmobile parts...",
  "vintage tools...",
  "RV appliances...",
  "antique furniture...",
  "project vehicles..."
];

let placeholderIndex = 0;

setInterval(() => {
  placeholderIndex = (placeholderIndex + 1) % placeholders.length;
  if (input && document.activeElement !== input && !input.value) {
    input.placeholder = placeholders[placeholderIndex];
  }
}, 2600);
