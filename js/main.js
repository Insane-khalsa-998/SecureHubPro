$(window).on('load resize', function() {
  $('.tab, .card').css('touch-action', 'manipulation');
});

// Theme toggle functionality for all pages
const themeToggle = document.getElementById("themeToggle");

// Toggle dark/light mode
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  document.body.classList.toggle("light-mode");

  const isDark = document.body.classList.contains("dark-mode");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";

  // Save theme preference
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// Apply saved theme on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
    themeToggle.textContent = "☀️ Light Mode";
  }
});