// DOM Elements with null checks
const elements = {
  password: document.getElementById("password"),
  togglePassword: document.getElementById("togglePassword"),
  strengthBar: document.getElementById("strengthBar"),
  strengthText: document.getElementById("strengthText")?.querySelector("span"),
  feedbackList: document.getElementById("feedbackList"),
  themeToggle: document.getElementById("themeToggle")
};

// Constants for password analysis
const PATTERNS = {
  lowercase: /[a-z]/g,
  uppercase: /[A-Z]/g,
  numbers: /\d/g,
  symbols: /[^A-Za-z0-9]/g,
  commonPatterns: /^(123|abc|qwerty|password|admin|letmein|welcome)/i,
  repeatingChars: /(.)\1{2,}/,
  keyboardPatterns: /(qwerty|asdfgh|zxcvbn|123456)/i
};

// Common password lists
const COMMON_PASSWORDS = new Set([
  'password', 'admin', '123456', 'qwerty', 'letmein', 'welcome',
  'monkey', 'dragon', 'baseball', 'football', 'master', 'hello'
]);

// Password entropy calculation
function calculateEntropy(password) {
  let charsetSize = 0;
  if (PATTERNS.lowercase.test(password)) charsetSize += 26;
  if (PATTERNS.uppercase.test(password)) charsetSize += 26;
  if (PATTERNS.numbers.test(password)) charsetSize += 10;
  if (PATTERNS.symbols.test(password)) charsetSize += 32;
  
  return Math.log2(Math.pow(charsetSize, password.length));
}

// Check for common patterns and sequences
function checkCommonPatterns(password) {
  const issues = [];
  const lowercasePass = password.toLowerCase();

  if (PATTERNS.commonPatterns.test(lowercasePass)) {
    issues.push("❌ Contains common password pattern");
  }
  
  if (PATTERNS.repeatingChars.test(password)) {
    issues.push("❌ Contains repeating characters");
  }
  
  if (PATTERNS.keyboardPatterns.test(lowercasePass)) {
    issues.push("❌ Contains keyboard pattern");
  }

  if (COMMON_PASSWORDS.has(lowercasePass)) {
    issues.push("⚠️ This is a commonly used password");
  }

  // Check for sequential characters
  const sequences = 'abcdefghijklmnopqrstuvwxyz01234567890';
  const reverseSequences = sequences.split('').reverse().join('');
  
  for (let i = 0; i < password.length - 2; i++) {
    const chunk = lowercasePass.slice(i, i + 3);
    if (sequences.includes(chunk) || reverseSequences.includes(chunk)) {
      issues.push("❌ Contains sequential characters");
      break;
    }
  }

  return issues;
}

// SHA-1 hash function for password leak check
async function sha1(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Check if password has been leaked
async function checkPasswordLeak(password) {
  try {
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5).toUpperCase();

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) throw new Error('Password API check failed');

    const text = await response.text();
    const hashes = text.split('\n');
    
    for (const hashLine of hashes) {
      const [hashSuffix, count] = hashLine.split(':');
      if (hashSuffix.trim() === suffix) {
        return parseInt(count);
      }
    }
    return 0;
  } catch (error) {
    console.error('Error checking password leak:', error);
    return -1; // Error code
  }
}

// Advanced password strength checker
async function checkPasswordStrength(password) {
  let score = 0;
  const feedback = [];

  // Basic length check
  if (password.length === 0) return { score: 0, feedback: [] };
  
  if (password.length < 8) {
    feedback.push("❌ Password should be at least 8 characters");
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Character variety checks
  const checks = [
    { pattern: PATTERNS.lowercase, message: "❌ Add lowercase letters" },
    { pattern: PATTERNS.uppercase, message: "❌ Add uppercase letters" },
    { pattern: PATTERNS.numbers, message: "❌ Include numbers" },
    { pattern: PATTERNS.symbols, message: "❌ Use special characters" }
  ];

  checks.forEach(({ pattern, message }) => {
    if (pattern.test(password)) {
      score++;
    } else {
      feedback.push(message);
    }
  });

  // Check entropy
  const entropy = calculateEntropy(password);
  if (entropy < 40) {
    feedback.push("⚠️ Password entropy is too low");
  } else if (entropy >= 80) {
    score++;
  }

  // Check common patterns
  const patternIssues = checkCommonPatterns(password);
  feedback.push(...patternIssues);
  score -= patternIssues.length * 0.5;

  // Check for password leaks
  const leakCount = await checkPasswordLeak(password);
  if (leakCount > 0) {
    feedback.push(`🚨 This password has been leaked ${leakCount.toLocaleString()} times!`);
    score -= 2;
  } else if (leakCount === -1) {
    feedback.push("⚠️ Couldn't check for password leaks");
  }

  // Normalize score
  score = Math.max(0, Math.min(score, 5));

  return { score, feedback, entropy };
}

// Update UI with enhanced feedback
function updateUI(result) {
  const { score, feedback, entropy } = result;

  // Update strength bar
  if (elements.strengthBar) {
    const percent = (score / 5) * 100;
    elements.strengthBar.style.width = `${percent}%`;

    // Color gradient from red to green
    const hue = (score / 5) * 120;
    elements.strengthBar.style.backgroundColor = `hsl(${hue}, 70%, 45%)`;
  }

  // Update strength text
  if (elements.strengthText) {
    const strengthLabels = {
      0: "Very Weak ❌",
      1: "Weak ⚠️",
      2: "Fair 🤔",
      3: "Good ✅",
      4: "Strong 💪",
      5: "Very Strong 🔒"
    };
    elements.strengthText.textContent = strengthLabels[Math.floor(score)];
  }

  // Update feedback list
  if (elements.feedbackList) {
    elements.feedbackList.innerHTML = "";
    
    // Add entropy information
    const entropyLi = document.createElement("li");
    entropyLi.className = "feedback-item";
    entropyLi.innerHTML = `📊 Password Entropy: ${entropy.toFixed(2)} bits ` +
      `(${entropy < 50 ? "Poor" : entropy < 70 ? "Fair" : entropy < 90 ? "Good" : "Excellent"})`;
    elements.feedbackList.appendChild(entropyLi);

    // Add other feedback
    feedback.forEach(msg => {
      const li = document.createElement("li");
      li.className = "feedback-item";
      li.textContent = msg;
      elements.feedbackList.appendChild(li);
    });
  }
}

// Event Listeners
elements.password?.addEventListener("input", async () => {
  const password = elements.password.value;
  const result = await checkPasswordStrength(password);
  updateUI(result);
});

elements.togglePassword?.addEventListener("click", () => {
  if (!elements.password) return;
  const type = elements.password.getAttribute("type") === "password" ? "text" : "password";
  elements.password.setAttribute("type", type);
  elements.togglePassword.textContent = type === "password" ? "👁️" : "🔒";
});

// Dark mode toggle with persistence
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.body.className = `${savedTheme}-mode`;
  
  if (elements.themeToggle) {
    elements.themeToggle.textContent = savedTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
}

elements.themeToggle?.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  document.documentElement.setAttribute("data-theme", newTheme);
  document.body.className = `${newTheme}-mode`;
  localStorage.setItem("theme", newTheme);
  
  if (elements.themeToggle) {
    elements.themeToggle.textContent = newTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  }
});

// Initialize theme on load
document.addEventListener("DOMContentLoaded", initTheme);