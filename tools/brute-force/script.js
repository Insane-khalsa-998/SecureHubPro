const passwordInput = document.getElementById("passwordInput");
const generateBtn = document.getElementById("generateBtn");
const startBtn = document.getElementById("startBtn");
const statusBox = document.getElementById("status");
const progressBar = document.getElementById("progressBar");

// Generate strong password
function generateStrongPassword(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

// Estimate possible combinations
function estimateCombinations(password) {
  let charsets = 0;
  if (/[a-z]/.test(password)) charsets += 26;
  if (/[A-Z]/.test(password)) charsets += 26;
  if (/\d/.test(password)) charsets += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsets += 32;

  return Math.pow(charsets, password.length);
}

// Log messages to status box
function logStatus(msg) {
  statusBox.innerHTML += msg + "<br>";
  statusBox.scrollTop = statusBox.scrollHeight;
}

// Clear status box
function clearStatus() {
  statusBox.innerHTML = "";
}

// Start brute-force simulation
async function simulateBruteForce(password) {
  clearStatus();
  progressBar.style.width = "0%";
  progressBar.textContent = "0%";

  const total = estimateCombinations(password);
  const maxGuesses = 10_000_000; // Simulate up to 10 million guesses
  const speed = 100_000; // 100k guesses per second

  logStatus(`🔍 Starting brute-force attack...`);
  logStatus(`🔢 Total combinations: ${total.toLocaleString()}`);
  logStatus(`⚡ Speed: ${speed.toLocaleString()} guesses/sec`);

  let guess = "";
  let attempts = 0;
  let found = false;

  const interval = setInterval(() => {
    for (let i = 0; i < 1000 && !found; i++) {
      attempts++;
      guess = randomGuess(password.length);

      if (guess === password) {
        found = true;
        clearInterval(interval);
        progressBar.style.width = "100%";
        progressBar.textContent = "100%";
        logStatus(`✅ Password FOUND: ${guess}`);
        logStatus(`🏁 Finished in ${Math.round(attempts / speed, 2)} seconds`);
        return;
      }

      if (attempts % 10000 === 0) {
        const percent = Math.min((attempts / total) * 100, 99);
        progressBar.style.width = percent + "%";
        progressBar.textContent = Math.round(percent) + "%";
      }
    }

    if (!found) {
      logStatus(`🕒 Attempting: ${guess} (${attempts.toLocaleString()})`);
    }
  }, 10);
}

// Random guess generator (for demo only)
function randomGuess(length) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
  let guess = "";
  for (let i = 0; i < length; i++) {
    guess += chars[Math.floor(Math.random() * chars.length)];
  }
  return guess;
}

// Event Listeners
generateBtn.addEventListener("click", () => {
  passwordInput.value = generateStrongPassword();
});

startBtn.addEventListener("click", () => {
  const password = passwordInput.value.trim();
  if (!password) {
    alert("Please enter a password.");
    return;
  }
  simulateBruteForce(password);
});