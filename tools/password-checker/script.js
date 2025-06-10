const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const strengthBar = document.getElementById("strengthBar");
const strengthText = document.getElementById("strengthText").querySelector("span");
const feedbackList = document.getElementById("feedbackList");

// Check password strength
function checkPasswordStrength(password) {
  let score = 0;
  const feedback = [];

  if (password.length >= 8) score++;
  else feedback.push("Increase length to at least 8 characters.");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Add uppercase letters.");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("Add lowercase letters.");

  if (/\d/.test(password)) score++;
  else feedback.push("Include numbers.");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push("Use special characters like !, @, #.");

  return { score, feedback };
}

// Update UI
function updateUI(score, feedback) {
  const percent = (score / 5) * 100;
  strengthBar.style.width = percent + "%";

  if (score <= 1) {
    strengthBar.style.backgroundColor = "#ff4d4d";
    strengthText.textContent = "Weak ❌";
  } else if (score === 2) {
    strengthBar.style.backgroundColor = "#ffa500";
    strengthText.textContent = "Medium ⚠️";
  } else {
    strengthBar.style.backgroundColor = "#90ee90";
    strengthText.textContent = "Strong ✅";
  }

  feedbackList.innerHTML = "";
  feedback.forEach((msg) => {
    const li = document.createElement("li");
    li.className = "feedback-item";
    li.textContent = msg;
    feedbackList.appendChild(li);
  });
}

// Leaked Password Check
async function checkLeakedPassword(password) {
  try {
    const sha1Hash = await hashPassword(password);
    const prefix = sha1Hash.slice(0, 5);
    const suffix = sha1Hash.slice(5).toUpperCase();

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`); 
    const data = await res.text();
    const hashes = data.split("\n").map((line) => line.split(":")[0]);

    if (hashes.includes(suffix)) {
      const li = document.createElement("li");
      li.className = "feedback-item text-danger";
      li.textContent = "⚠️ This password has been leaked in a breach!";
      feedbackList.appendChild(li);
    }
  } catch (err) {
    console.error("Error checking leaked password:", err);
  }
}

// SHA-1 Hashing
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Event Listener
passwordInput.addEventListener("input", async () => {
  const password = passwordInput.value.trim();

  if (!password) {
    feedbackList.innerHTML = "";
    strengthBar.style.width = "0%";
    strengthText.textContent = "N/A";
    return;
  }

  const result = checkPasswordStrength(password);
  updateUI(result.score, result.feedback);

  if (result.score >= 3) {
    await checkLeakedPassword(password);
  }
});

// Toggle password visibility
togglePassword.addEventListener("click", () => {
  const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
});