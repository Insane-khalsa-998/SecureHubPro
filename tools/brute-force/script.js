// DOM Elements
const elements = {
  // Theme and UI
  themeToggle: document.getElementById('themeToggle'),
  datetime: document.querySelector('.datetime'),
  userInfo: document.querySelector('.user'),
  
  // Mode Toggle
  passwordMode: document.getElementById('passwordMode'),
  fileMode: document.getElementById('fileMode'),
  
  // Sections
  passwordSection: document.getElementById('passwordSection'),
  fileSection: document.getElementById('fileSection'),
  wordlistSection: document.getElementById('wordlistSection'),
  
  // Inputs
  passwordInput: document.getElementById('passwordInput'),
  fileInput: document.getElementById('fileInput'),
  wordlistInput: document.getElementById('wordlistInput'),
  attackType: document.getElementById('attackType'),
  
  // Character Sets
  lowercase: document.getElementById('lowercase'),
  uppercase: document.getElementById('uppercase'),
  numbers: document.getElementById('numbers'),
  symbols: document.getElementById('symbols'),
  
  // Controls
  generateBtn: document.getElementById('generateBtn'),
  startBtn: document.getElementById('startBtn'),
  
  // Status and Progress
  statusBox: document.getElementById('statusBox'),
  progressBar: document.getElementById('progressBar'),
  attemptCount: document.getElementById('attemptCount'),
  speedCount: document.getElementById('speedCount'),
  timeLeft: document.getElementById('timeLeft'),
  
  // Instructions
  toggleInstructions: document.getElementById('toggleInstructions'),
  instructionsBody: document.getElementById('instructionsBody')
};

// Constants
const CHARSET = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

const CONFIG = {
  maxGuesses: 10_000_000,
  guessesPerBatch: 1000,
  updateInterval: 50,
  baseSpeed: 100_000
};

// Update datetime
function updateDateTime() {
  const now = new Date();
  const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
  if (elements.datetime) {
    elements.datetime.textContent = formatted;
  }
}

// Status Logging
function logStatus(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const msgElement = document.createElement('div');
  msgElement.className = `status-message ${type}`;
  msgElement.innerHTML = `[${timestamp}] ${message}`;
  
  elements.statusBox.appendChild(msgElement);
  elements.statusBox.scrollTop = elements.statusBox.scrollHeight;

  // Keep only last 100 messages
  while (elements.statusBox.children.length > 100) {
    elements.statusBox.removeChild(elements.statusBox.firstChild);
  }
}

// Generate Password
function generatePassword(length = 12) {
  let charset = '';
  if (elements.lowercase.checked) charset += CHARSET.lowercase;
  if (elements.uppercase.checked) charset += CHARSET.uppercase;
  if (elements.numbers.checked) charset += CHARSET.numbers;
  if (elements.symbols.checked) charset += CHARSET.symbols;
  
  if (!charset) {
    logStatus('⚠️ Please select at least one character set', 'warning');
    return '';
  }

  let password = '';
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  
  return password;
}

// Estimate Time
function estimateTime(password) {
  let charset = '';
  if (/[a-z]/.test(password)) charset += CHARSET.lowercase;
  if (/[A-Z]/.test(password)) charset += CHARSET.uppercase;
  if (/\d/.test(password)) charset += CHARSET.numbers;
  if (/[^a-zA-Z0-9]/.test(password)) charset += CHARSET.symbols;

  const combinations = Math.pow(charset.length, password.length);
  const seconds = combinations / CONFIG.baseSpeed;
  
  return {
    combinations,
    seconds,
    formatted: formatTime(seconds)
  };
}

// Format Time
function formatTime(seconds) {
  if (seconds < 60) return `${seconds.toFixed(2)} seconds`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)} minutes`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(2)} hours`;
  if (seconds < 31536000) return `${(seconds / 86400).toFixed(2)} days`;
  return `${(seconds / 31536000).toFixed(2)} years`;
}

// Update Progress
function updateProgress(current, total, speed) {
  const percent = (current / total) * 100;
  elements.progressBar.style.width = `${percent}%`;
  elements.progressBar.textContent = `${percent.toFixed(1)}%`;
  
  elements.attemptCount.textContent = current.toLocaleString();
  elements.speedCount.textContent = `${speed.toLocaleString()}/s`;
  elements.timeLeft.textContent = formatTime((total - current) / speed);
}

// Brute Force Attack
async function startBruteForce(target, isFile = false) {
  let startTime = Date.now();
  let attempts = 0;
  let lastUpdate = startTime;
  let avgSpeed = 0;

  // Reset UI
  elements.startBtn.disabled = true;
  elements.progressBar.style.width = '0%';
  elements.statusBox.innerHTML = '';
  
  // Get charset
  let charset = '';
  if (elements.lowercase.checked) charset += CHARSET.lowercase;
  if (elements.uppercase.checked) charset += CHARSET.uppercase;
  if (elements.numbers.checked) charset += CHARSET.numbers;
  if (elements.symbols.checked) charset += CHARSET.symbols;

  if (!charset) {
    logStatus('⚠️ Please select at least one character set', 'warning');
    elements.startBtn.disabled = false;
    return;
  }

  // Estimate complexity
  const estimate = estimateTime(target);
  logStatus(`🔒 Target length: ${target.length} characters`);
  logStatus(`🔢 Possible combinations: ${estimate.combinations.toLocaleString()}`);
  logStatus(`⏱️ Estimated time: ${estimate.formatted}`);
  logStatus(`🚀 Starting attack...`);

  try {
    const simulationLoop = setInterval(() => {
      for (let i = 0; i < CONFIG.guessesPerBatch; i++) {
        attempts++;
        const guess = generatePassword(target.length);

        // Update progress
        if (attempts % 1000 === 0) {
          const now = Date.now();
          const timeDiff = (now - lastUpdate) / 1000;
          const currentSpeed = 1000 / timeDiff;
          avgSpeed = avgSpeed * 0.9 + currentSpeed * 0.1;
          
          updateProgress(attempts, estimate.combinations, Math.round(avgSpeed));
          lastUpdate = now;
          
          if (attempts % 10000 === 0) {
            logStatus(`🔍 Testing: ${guess}`);
          }
        }

        // Check if password found
        if (guess === target) {
          clearInterval(simulationLoop);
          const timeTotal = (Date.now() - startTime) / 1000;
          
          updateProgress(attempts, attempts, Math.round(attempts / timeTotal));
          logStatus(`✅ Password found: ${guess}`, 'success');
          logStatus(`🏁 Total attempts: ${attempts.toLocaleString()}`);
          logStatus(`⌛ Time taken: ${formatTime(timeTotal)}`);
          
          elements.startBtn.disabled = false;
          return;
        }

        // Stop if max attempts reached
        if (attempts >= CONFIG.maxGuesses) {
          clearInterval(simulationLoop);
          logStatus(`🛑 Maximum attempts reached (${CONFIG.maxGuesses.toLocaleString()})`, 'warning');
          elements.startBtn.disabled = false;
          return;
        }
      }
    }, CONFIG.updateInterval);
  } catch (error) {
    logStatus(`❌ Error: ${error.message}`, 'error');
    elements.startBtn.disabled = false;
  }
}

// Event Listeners
function setupEventListeners() {
  // Mode Toggle
  elements.passwordMode?.addEventListener('click', () => {
    elements.passwordMode.classList.add('active');
    elements.fileMode.classList.remove('active');
    elements.passwordSection.classList.remove('d-none');
    elements.fileSection.classList.add('d-none');
    logStatus('Switched to password mode');
  });

  elements.fileMode?.addEventListener('click', () => {
    elements.fileMode.classList.add('active');
    elements.passwordMode.classList.remove('active');
    elements.fileSection.classList.remove('d-none');
    elements.passwordSection.classList.add('d-none');
    logStatus('Switched to file mode');
  });

  // Attack Type Change
  elements.attackType?.addEventListener('change', () => {
    elements.wordlistSection.classList.toggle('d-none', 
      elements.attackType.value !== 'dictionary');
  });

  // Generate Password
  elements.generateBtn?.addEventListener('click', () => {
    const password = generatePassword();
    elements.passwordInput.value = password;
    logStatus(`🎲 Generated password: ${password}`);
  });

      // Start Attack
    elements.startBtn?.addEventListener('click', () => {
        const isFileMode = elements.fileMode.classList.contains('active');
        
        if (isFileMode) {
            const file = elements.fileInput.files[0];
            if (!file) {
                logStatus('⚠️ Please select a file to crack', 'warning');
                return;
            }

            // Check file type
            const fileType = file.name.split('.').pop().toLowerCase();
            const supportedTypes = ['zip', 'pdf', 'doc', 'docx'];
            
            if (!supportedTypes.includes(fileType)) {
                logStatus('❌ Unsupported file type. Please use ZIP, PDF, or DOC/DOCX files', 'error');
                return;
            }

            if (elements.attackType.value === 'dictionary') {
                const wordlist = elements.wordlistInput.files[0];
                if (!wordlist) {
                    logStatus('⚠️ Please select a wordlist file', 'warning');
                    return;
                }
                
                // Start dictionary attack simulation
                logStatus('📚 Starting dictionary attack...');
                simulateDictionaryAttack(file, wordlist);
            } else {
                // Start brute force attack simulation
                logStatus('🔨 Starting brute force attack on file...');
                simulateFileAttack(file);
            }
        } else {
            const password = elements.passwordInput.value.trim();
            if (!password) {
                logStatus('⚠️ Please enter a password to test', 'warning');
                return;
            }
            startBruteForce(password);
        }
    });

    // Theme Toggle
    elements.themeToggle?.addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const icon = elements.themeToggle.querySelector('i');
        if (icon) {
            icon.className = `bi bi-${newTheme === 'dark' ? 'sun' : 'moon-stars'}`;
        }
        
        logStatus(`🎨 Switched to ${newTheme} mode`);
    });

    // Instructions Toggle
    elements.toggleInstructions?.addEventListener('click', () => {
        const instructions = elements.instructionsBody;
        if (instructions.style.display === 'none') {
            instructions.style.display = 'block';
            localStorage.setItem('showInstructions', 'true');
        } else {
            instructions.style.display = 'none';
            localStorage.setItem('showInstructions', 'false');
        }
    });
}

// File Attack Simulation
async function simulateFileAttack(file) {
    const fileSize = file.size;
    const startTime = Date.now();
    let attempts = 0;
    let lastUpdate = startTime;

    try {
        const simulationLoop = setInterval(() => {
            for (let i = 0; i < CONFIG.guessesPerBatch; i++) {
                attempts++;

                // Update progress
                if (attempts % 1000 === 0) {
                    const now = Date.now();
                    const timeDiff = (now - lastUpdate) / 1000;
                    const speed = Math.round(1000 / timeDiff);
                    
                    updateProgress(attempts, CONFIG.maxGuesses, speed);
                    lastUpdate = now;

                    if (attempts % 10000 === 0) {
                        const guess = generatePassword();
                        logStatus(`🔍 Testing password: ${guess}`);
                    }
                }

                // Simulate finding password (1 in 1,000,000 chance)
                if (Math.random() < 0.000001) {
                    clearInterval(simulationLoop);
                    const password = generatePassword();
                    const timeTotal = (Date.now() - startTime) / 1000;
                    
                    updateProgress(attempts, attempts, Math.round(attempts / timeTotal));
                    logStatus(`✅ File password found: ${password}`, 'success');
                    logStatus(`🏁 Total attempts: ${attempts.toLocaleString()}`);
                    logStatus(`⌛ Time taken: ${formatTime(timeTotal)}`);
                    
                    elements.startBtn.disabled = false;
                    return;
                }

                if (attempts >= CONFIG.maxGuesses) {
                    clearInterval(simulationLoop);
                    logStatus(`🛑 Attack stopped after ${attempts.toLocaleString()} attempts`, 'warning');
                    elements.startBtn.disabled = false;
                    return;
                }
            }
        }, CONFIG.updateInterval);
    } catch (error) {
        logStatus(`❌ Error: ${error.message}`, 'error');
        elements.startBtn.disabled = false;
    }
}

// Dictionary Attack Simulation
async function simulateDictionaryAttack(file, wordlist) {
    const startTime = Date.now();
    let attempts = 0;
    let lastUpdate = startTime;

    try {
        const reader = new FileReader();
        reader.onload = (e) => {
            const words = e.target.result.split('\n')
                .map(word => word.trim())
                .filter(word => word.length > 0);
            
            const totalWords = words.length;
            logStatus(`📚 Loaded ${totalWords.toLocaleString()} words from dictionary`);

            const simulationLoop = setInterval(() => {
                for (let i = 0; i < 100; i++) {
                    if (attempts >= totalWords) {
                        clearInterval(simulationLoop);
                        const timeTotal = (Date.now() - startTime) / 1000;
                        logStatus(`🛑 Dictionary exhausted after ${timeTotal.toFixed(2)} seconds`, 'warning');
                        elements.startBtn.disabled = false;
                        return;
                    }

                    const word = words[attempts];
                    attempts++;

                    // Update progress
                    if (attempts % 100 === 0) {
                        const now = Date.now();
                        const timeDiff = (now - lastUpdate) / 1000;
                        const speed = Math.round(100 / timeDiff);
                        
                        updateProgress(attempts, totalWords, speed);
                        lastUpdate = now;

                        logStatus(`🔍 Testing: ${word}`);
                    }

                    // Simulate finding password (1 in 10,000 chance)
                    if (Math.random() < 0.0001) {
                        clearInterval(simulationLoop);
                        const timeTotal = (Date.now() - startTime) / 1000;
                        
                        updateProgress(attempts, attempts, Math.round(attempts / timeTotal));
                        logStatus(`✅ File password found: ${word}`, 'success');
                        logStatus(`🏁 Words tested: ${attempts.toLocaleString()}`);
                        logStatus(`⌛ Time taken: ${formatTime(timeTotal)}`);
                        
                        elements.startBtn.disabled = false;
                        return;
                    }
                }
            }, CONFIG.updateInterval);
        };
        reader.readAsText(wordlist);
    } catch (error) {
        logStatus(`❌ Error: ${error.message}`, 'error');
        elements.startBtn.disabled = false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update datetime
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Set user info
    if (elements.userInfo) {
        elements.userInfo.textContent = '@Insane-khalsa-998';
    }
    
    // Initialize instructions visibility
    const showInstructions = localStorage.getItem('showInstructions') !== 'false';
    if (elements.instructionsBody) {
        elements.instructionsBody.style.display = showInstructions ? 'block' : 'none';
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Log initial status
    logStatus('🚀 Brute-force Password Simulator ready');
    logStatus('ℹ️ Select mode and enter target to begin');
});