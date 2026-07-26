const form = document.getElementById("preview-search");
const input = document.getElementById("search-input");
const note = document.getElementById("search-note");
const year = document.getElementById("year");

year.textContent = new Date().getFullYear();

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const searchTerm = input.value.trim();

  if (!searchTerm) {
    note.textContent = "Enter something you would like to search for.";
    input.focus();
    return;
  }

  note.textContent = `Search for “${searchTerm}” is coming soon.`;
});

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
  if (document.activeElement !== input && !input.value) {
    input.placeholder = placeholders[placeholderIndex];
  }
}, 2600);
