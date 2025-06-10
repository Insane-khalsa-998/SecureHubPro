// DOM Elements
const elements = {
  // Theme and UI
  themeToggle: document.getElementById('themeToggle'),
  datetime: document.querySelector('.datetime'),
  userInfo: document.querySelector('.user'),
  
  // Mode Toggle
  encodeMode: document.getElementById('encodeMode'),
  decodeMode: document.getElementById('decodeMode'),
  
  // Instructions
  toggleInstructions: document.getElementById('toggleInstructions'),
  instructionsBody: document.getElementById('instructionsBody'),
  
  // Input/Output
  messageInput: document.getElementById('messageInput'),
  messageSection: document.getElementById('messageSection'),
  imageInput: document.getElementById('imageInput'),
  canvas: document.getElementById('canvas'),
  
  // Password Management
  passwordInput: document.getElementById('passwordInput'),
  generateKey: document.getElementById('generateKey'),
  copyKey: document.getElementById('copyKey'),
  savedKeys: document.getElementById('savedKeys'),
  saveKey: document.getElementById('saveKey'),
  deleteKey: document.getElementById('deleteKey'),
  
  // Action Buttons
  encodeBtn: document.getElementById('encodeBtn'),
  decodeBtn: document.getElementById('decodeBtn'),
  copyResult: document.getElementById('copyResult'),
  downloadLink: document.getElementById('downloadLink')
};

// Constants
const ENCRYPTION_ALGO = "AES-GCM";
const MAX_MESSAGE_LENGTH = 1000;

// Update datetime every second
function updateDateTime() {
  const now = new Date();
  const formatted = now.toISOString().replace('T', ' ').slice(0, 19);
  if (elements.datetime) {
    elements.datetime.textContent = formatted;
  }
}

// Toast Notification System
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Theme Management
function toggleTheme() {
  const root = document.documentElement;
  const currentTheme = root.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  const icon = elements.themeToggle.querySelector('i');
  if (icon) {
    icon.className = `bi bi-${newTheme === 'dark' ? 'sun' : 'moon-stars'}`;
  }
  
  showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`);
}

// Password Management
const keyStorage = {
  getKeys() {
    const keys = localStorage.getItem('stegoKeys');
    return keys ? JSON.parse(keys) : {};
  },

  saveKey(name, key) {
    const keys = this.getKeys();
    keys[name] = {
      key,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('stegoKeys', JSON.stringify(keys));
    this.updateKeyList();
  },

  deleteKey(name) {
    const keys = this.getKeys();
    delete keys[name];
    localStorage.setItem('stegoKeys', JSON.stringify(keys));
    this.updateKeyList();
  },

  updateKeyList() {
    elements.savedKeys.innerHTML = '<option value="">Select a saved password...</option>';
    
    Object.entries(this.getKeys()).forEach(([name, data]) => {
      const option = document.createElement('option');
      option.value = data.key;
      option.textContent = name;
      elements.savedKeys.appendChild(option);
    });
  }
};

// Steganography Functions
async function encryptMessage(message, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("stego-salt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: ENCRYPTION_ALGO, length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGO, iv },
    key,
    data
  );

  return { encrypted, iv };
}

async function decryptMessage(encrypted, iv, password) {
  try {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("stego-salt"),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: ENCRYPTION_ALGO, length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGO, iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error("Decryption failed. Wrong password?");
  }
}

async function embedMessage(image, message, password) {
  const { encrypted, iv } = await encryptMessage(message, password);
  
  const canvas = elements.canvas;
  const ctx = canvas.getContext('2d');
  
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert encrypted data to binary
  const encryptedArray = new Uint8Array(encrypted);
  const messageBin = Array.from(encryptedArray)
    .map(byte => byte.toString(2).padStart(8, "0"))
    .join("");

  // Embed length and IV
  const lengthBin = encryptedArray.length.toString(2).padStart(32, "0");
  const ivBin = Array.from(iv)
    .map(byte => byte.toString(2).padStart(8, "0"))
    .join("");

  const fullMessage = lengthBin + ivBin + messageBin;

  // Embed data in least significant bits
  for (let i = 0; i < fullMessage.length; i++) {
    const pixelIndex = i * 4;
    if (pixelIndex < data.length) {
      data[pixelIndex] = (data[pixelIndex] & 254) | parseInt(fullMessage[i]);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

async function extractMessage(image, password) {
  const canvas = elements.canvas;
  const ctx = canvas.getContext('2d');
  
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Extract binary data
  let extracted = "";
  for (let i = 0; i < data.length; i += 4) {
    extracted += data[i] & 1;
  }

  // Parse length and IV
  const length = parseInt(extracted.slice(0, 32), 2);
  const iv = new Uint8Array(12);
  const ivBits = extracted.slice(32, 32 + 96);
  
  for (let i = 0; i < 12; i++) {
    iv[i] = parseInt(ivBits.slice(i * 8, (i + 1) * 8), 2);
  }

  // Parse encrypted message
  const messageBits = extracted.slice(32 + 96, 32 + 96 + length * 8);
  const encrypted = new Uint8Array(length);
  
  for (let i = 0; i < length; i++) {
    encrypted[i] = parseInt(messageBits.slice(i * 8, (i + 1) * 8), 2);
  }

  return await decryptMessage(encrypted, iv, password);
}

// Event Handlers
function setupEventListeners() {
  // Mode Toggle
  elements.encodeMode?.addEventListener('click', () => {
    elements.encodeMode.classList.add('active');
    elements.decodeMode.classList.remove('active');
    elements.encodeBtn.classList.remove('d-none');
    elements.decodeBtn.classList.add('d-none');
    elements.messageSection.classList.remove('d-none');
    elements.copyResult.classList.add('d-none');
    showToast('Switched to encode mode');
  });

  elements.decodeMode?.addEventListener('click', () => {
    elements.decodeMode.classList.add('active');
    elements.encodeMode.classList.remove('active');
    elements.decodeBtn.classList.remove('d-none');
    elements.encodeBtn.classList.add('d-none');
    elements.messageSection.classList.add('d-none');
    elements.copyResult.classList.remove('d-none');
    showToast('Switched to decode mode');
  });

  // Image Input
  elements.imageInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = new Image();
        image.onload = () => {
          const canvas = elements.canvas;
          const ctx = canvas.getContext('2d');
          canvas.width = image.width;
          canvas.height = image.height;
          ctx.drawImage(image, 0, 0);
        };
        image.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Encode/Decode Actions
  elements.encodeBtn?.addEventListener('click', async () => {
    try {
      if (!elements.imageInput.files[0]) throw new Error("Please select an image");
      if (!elements.messageInput.value) throw new Error("Please enter a message");
      if (!elements.passwordInput.value) throw new Error("Please enter a password");

      const image = new Image();
      image.src = URL.createObjectURL(elements.imageInput.files[0]);
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const resultDataUrl = await embedMessage(
        image,
        elements.messageInput.value,
        elements.passwordInput.value
      );

      elements.downloadLink.href = resultDataUrl;
      elements.downloadLink.download = 'stego-image.png';
      elements.downloadLink.classList.remove('d-none');
      
      showToast('Message embedded successfully! 🎯');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  elements.decodeBtn?.addEventListener('click', async () => {
    try {
      if (!elements.imageInput.files[0]) throw new Error("Please select an image");
      if (!elements.passwordInput.value) throw new Error("Please enter a password");

      const image = new Image();
      image.src = URL.createObjectURL(elements.imageInput.files[0]);
      
      await new Promise((resolve) => {
        image.onload = resolve;
      });

      const message = await extractMessage(image, elements.passwordInput.value);
      elements.messageInput.value = message;
      elements.copyResult.classList.remove('d-none');
      
      showToast('Message extracted successfully! 🔍');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  // Password Management
  elements.generateKey?.addEventListener('click', () => {
    const key = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    elements.passwordInput.value = key;
    showToast('New password generated! 🔑');
  });

  elements.copyKey?.addEventListener('click', () => {
    if (elements.passwordInput.value) {
      navigator.clipboard.writeText(elements.passwordInput.value);
      showToast('Password copied to clipboard! 📋');
    }
  });

  elements.saveKey?.addEventListener('click', () => {
    const key = elements.passwordInput.value.trim();
    if (!key) {
      showToast('Please generate or enter a password first', 'error');
      return;
    }

    const name = prompt('Enter a name for this password:');
    if (name) {
      keyStorage.saveKey(name, key);
      showToast('Password saved successfully! 🔑');
    }
  });

  elements.deleteKey?.addEventListener('click', () => {
    const option = elements.savedKeys.selectedOptions[0];
    if (!option || !option.textContent) {
      showToast('Please select a password to delete', 'error');
      return;
    }

    if (confirm(`Are you sure you want to delete the password "${option.textContent}"?`)) {
      keyStorage.deleteKey(option.textContent);
      showToast('Password deleted successfully! 🗑️');
    }
  });

  // Load saved password
  elements.savedKeys?.addEventListener('change', (e) => {
    const key = e.target.value;
    if (key) {
      elements.passwordInput.value = key;
      showToast('Password loaded! 🔐');
    }
  });

  // Copy Result
  elements.copyResult?.addEventListener('click', () => {
    if (elements.messageInput.value) {
      navigator.clipboard.writeText(elements.messageInput.value);
      showToast('Message copied to clipboard! 📋');
    }
  });

  // Theme Toggle
  elements.themeToggle?.addEventListener('click', toggleTheme);

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
    elements.userInfo.textContent = 'Insane-khalsa-998';
  }
  
  // Initialize password list
  keyStorage.updateKeyList();
  

  // Initialize instructions visibility
  const showInstructions = localStorage.getItem('showInstructions') !== 'false';
  if (elements.instructionsBody) {
    elements.instructionsBody.style.display = showInstructions ? 'block' : 'none';
  }

  // Initialize mode state
  function updateModeState(isEncodeMode) {
    if (elements.encodeMode && elements.decodeMode) {
      elements.encodeMode.classList.toggle('active', isEncodeMode);
      elements.decodeMode.classList.toggle('active', !isEncodeMode);
    }
    
    if (elements.encodeBtn && elements.decodeBtn) {
      elements.encodeBtn.classList.toggle('d-none', !isEncodeMode);
      elements.decodeBtn.classList.toggle('d-none', isEncodeMode);
    }
    
    if (elements.messageSection) {
      elements.messageSection.classList.toggle('d-none', !isEncodeMode);
    }
    
    if (elements.copyResult) {
      elements.copyResult.classList.toggle('d-none', isEncodeMode);
    }
    
    if (elements.downloadLink) {
      elements.downloadLink.classList.add('d-none');
    }
    
    // Update placeholder text based on mode
    if (elements.messageInput) {
      elements.messageInput.placeholder = isEncodeMode 
        ? "Enter your secret message here..." 
        : "Decoded message will appear here...";
    }
    
    // Clear previous results
    if (elements.canvas) {
      const ctx = elements.canvas.getContext('2d');
      ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    }
    if (elements.messageInput) elements.messageInput.value = '';
    if (elements.passwordInput) elements.passwordInput.value = '';
  }

  // Set initial mode
  const savedMode = localStorage.getItem('stegoMode') || 'encode';
  updateModeState(savedMode === 'encode');

  // Update mode toggle listeners
  elements.encodeMode?.addEventListener('click', () => {
    updateModeState(true);
    localStorage.setItem('stegoMode', 'encode');
    showToast('Switched to encode mode 🔒');
  });

  elements.decodeMode?.addEventListener('click', () => {
    updateModeState(false);
    localStorage.setItem('stegoMode', 'decode');
    showToast('Switched to decode mode 🔓');
  });

  // Setup datetime update
  function updateDateTime() {
    const now = new Date();
    const formatted = now.toISOString().slice(0, 19).replace('T', ' ');
    if (elements.datetime) {
      elements.datetime.textContent = formatted;
    }
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Set current user
  const currentUser = 'Insane-khalsa-998';
  if (elements.userInfo) {
    elements.userInfo.textContent = currentUser;
  }

  // Initialize event listeners
  setupEventListeners();
});

// Add these helper functions at the end
function generateRandomPassword(length = 16) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  return password;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Add input validation
function validateInput(file, message, password, isEncodeMode) {
  if (!file) {
    throw new Error('Please select an image');
  }
  
  if (file.type !== 'image/png') {
    throw new Error('Please use PNG images only');
  }
  
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be less than 5MB');
  }
  
  if (isEncodeMode && !message) {
    throw new Error('Please enter a message to hide');
  }
  
  if (!password) {
    throw new Error('Please enter a password');
  }
  
  if (isEncodeMode && message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
  }
}