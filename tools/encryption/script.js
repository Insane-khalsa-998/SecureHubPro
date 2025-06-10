// DOM Elements
const elements = {
  // Theme and UI
  themeToggle: document.getElementById('themeToggle'),
  currentUser: document.querySelector('.user-info'),
  datetime: document.querySelector('.datetime'),
  
  // Mode Selection
  textMode: document.getElementById('textMode'),
  fileMode: document.getElementById('fileMode'),
  
  // Input/Output
  plaintext: document.getElementById('plaintext'),
  result: document.getElementById('result'),
  
  // Algorithm Selection
  aesAlgo: document.getElementById('aesAlgo'),
  desAlgo: document.getElementById('desAlgo'),
  
  // Key Management
  key: document.getElementById('key'),
  generateKey: document.getElementById('generateKey'),
  copyKey: document.getElementById('copyKey'),
  savedKeys: document.getElementById('savedKeys'),
  saveKey: document.getElementById('saveKey'),
  deleteKey: document.getElementById('deleteKey'),
  
  // Action Buttons
  encryptBtn: document.getElementById('encryptBtn'),
  decryptBtn: document.getElementById('decryptBtn'),
  pasteBtn: document.getElementById('pasteBtn'),
  clearBtn: document.getElementById('clearBtn'),
  copyResult: document.getElementById('copyResult'),
  downloadResult: document.getElementById('downloadResult')
};

// Encryption Constants
const ALGORITHMS = {
  'AES-256': {
    name: 'AES-GCM',
    length: 256,
    ivLength: 12
  },
  'DES': {
    name: 'DES-CBC',
    length: 64,
    ivLength: 8
  }
};

// Toast Notification System
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Remove toast after 3 seconds
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
  
  // Update theme toggle button
  elements.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`);
}

// Initialize theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  elements.themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// Cryptographic Functions
async function generateCryptoKey(algorithm) {
  const algo = ALGORITHMS[algorithm];
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: algo.name,
        length: algo.length
      },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    throw new Error('Failed to generate key');
  }
}

async function exportKey(key) {
  try {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  } catch (error) {
    throw new Error('Failed to export key');
  }
}

async function importKey(keyData, algorithm) {
  try {
    const algo = ALGORITHMS[algorithm];
    const keyArray = new Uint8Array(atob(keyData).split('').map(c => c.charCodeAt(0)));
    return await window.crypto.subtle.importKey(
      'raw',
      keyArray,
      algo.name,
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    throw new Error('Invalid key format');
  }
}

// Encryption/Decryption Functions
async function encrypt(text, algorithm) {
  try {
    const algo = ALGORITHMS[algorithm];
    const key = await generateCryptoKey(algorithm);
    const iv = window.crypto.getRandomValues(new Uint8Array(algo.ivLength));
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: algo.name,
        iv
      },
      key,
      new TextEncoder().encode(text)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return {
      data: btoa(String.fromCharCode(...combined)),
      key: await exportKey(key)
    };
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

async function decrypt(encryptedData, keyData, algorithm) {
  try {
    const algo = ALGORITHMS[algorithm];
    const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    
    const iv = combined.slice(0, algo.ivLength);
    const encrypted = combined.slice(algo.ivLength);
    
    const key = await importKey(keyData, algorithm);
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: algo.name,
        iv
      },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

// Key Management
const keyStorage = {
  getKeys() {
    const keys = localStorage.getItem('encryptionKeys');
    return keys ? JSON.parse(keys) : {};
  },

  saveKey(name, key, algorithm) {
    const keys = this.getKeys();
    keys[name] = {
      key,
      algorithm,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('encryptionKeys', JSON.stringify(keys));
    this.updateKeyList();
  },

  deleteKey(name) {
    const keys = this.getKeys();
    delete keys[name];
    localStorage.setItem('encryptionKeys', JSON.stringify(keys));
    this.updateKeyList();
  },

  updateKeyList() {
    elements.savedKeys.innerHTML = '<option value="">Select a saved key...</option>';
    
    Object.entries(this.getKeys()).forEach(([name, data]) => {
      const option = document.createElement('option');
      option.value = data.key;
      option.dataset.algorithm = data.algorithm;
      option.textContent = `${name} (${data.algorithm})`;
      elements.savedKeys.appendChild(option);
    });
  }
};

// Event Handlers
async function handleEncryption() {
  try {
    const text = elements.plaintext.value.trim();
    if (!text) {
      showToast('Please enter text to encrypt', 'error');
      return;
    }

    elements.encryptBtn.disabled = true;
    const algorithm = elements.aesAlgo.classList.contains('active') ? 'AES-256' : 'DES';
    const result = await encrypt(text, algorithm);

    elements.key.value = result.key;
    elements.result.value = result.data;
    showToast('Encryption successful! 🔒');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    elements.encryptBtn.disabled = false;
  }
}

async function handleDecryption() {
  try {
    const text = elements.plaintext.value.trim();
    const key = elements.key.value.trim();

    if (!text || !key) {
      showToast('Please enter both encrypted text and key', 'error');
      return;
    }

    elements.decryptBtn.disabled = true;
    const algorithm = elements.aesAlgo.classList.contains('active') ? 'AES-256' : 'DES';
    const decrypted = await decrypt(text, key, algorithm);

    elements.result.value = decrypted;
    showToast('Decryption successful! 🔓');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    elements.decryptBtn.disabled = false;
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Theme Toggle
  elements.themeToggle?.addEventListener('click', toggleTheme);

  // Mode Selection
  elements.fileMode?.addEventListener('click', () => {
    showToast('File mode coming soon! 🚧', 'info');
  });

  // Encryption/Decryption
  elements.encryptBtn?.addEventListener('click', handleEncryption);
  elements.decryptBtn?.addEventListener('click', handleDecryption);

  // Key Management
  elements.generateKey?.addEventListener('click', async () => {
    try {
      const algorithm = elements.aesAlgo.classList.contains('active') ? 'AES-256' : 'DES';
      const key = await generateCryptoKey(algorithm);
      elements.key.value = await exportKey(key);
      showToast('New key generated! 🔑');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  // Clipboard Operations
  elements.copyKey?.addEventListener('click', () => {
    if (elements.key.value) {
      navigator.clipboard.writeText(elements.key.value);
      showToast('Key copied to clipboard! 📋');
    }
  });

  elements.copyResult?.addEventListener('click', () => {
    if (elements.result.value) {
      navigator.clipboard.writeText(elements.result.value);
      showToast('Result copied to clipboard! 📋');
    }
  });

  elements.pasteBtn?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      elements.plaintext.value = text;
      showToast('Text pasted! 📋');
    } catch (error) {
      showToast('Failed to paste text', 'error');
    }
  });

  // Clear Fields
  elements.clearBtn?.addEventListener('click', () => {
    elements.plaintext.value = '';
    elements.result.value = '';
    elements.key.value = '';
    showToast('All fields cleared! 🧹');
  });

  // Algorithm Selection
  elements.aesAlgo?.addEventListener('click', () => {
    elements.aesAlgo.classList.add('active');
    elements.desAlgo.classList.remove('active');
  });

  elements.desAlgo?.addEventListener('click', () => {
    elements.desAlgo.classList.add('active');
    elements.aesAlgo.classList.remove('active');
  });

  // Save/Delete Keys
  elements.saveKey?.addEventListener('click', () => {
    const key = elements.key.value.trim();
    if (!key) {
      showToast('Please generate or enter a key first', 'error');
      return;
    }

    const name = prompt('Enter a name for this key:');
    if (name) {
      const algorithm = elements.aesAlgo.classList.contains('active') ? 'AES-256' : 'DES';
      keyStorage.saveKey(name, key, algorithm);
      showToast('Key saved successfully! 🔑');
    }
  });

  elements.deleteKey?.addEventListener('click', () => {
    const option = elements.savedKeys.selectedOptions[0];
    if (!option || !option.textContent) {
      showToast('Please select a key to delete', 'error');
      return;
    }

    const name = option.textContent.split(' (')[0];
    if (confirm(`Are you sure you want to delete the key "${name}"?`)) {
      keyStorage.deleteKey(name);
      showToast('Key deleted successfully! 🗑️');
    }
  });

  // Load saved key
  elements.savedKeys?.addEventListener('change', (e) => {
    const key = e.target.value;
    if (key) {
      elements.key.value = key;
      const algorithm = e.target.selectedOptions[0].dataset.algorithm;
      if (algorithm === 'AES-256') {
        elements.aesAlgo.classList.add('active');
        elements.desAlgo.classList.remove('active');
      } else {
        elements.desAlgo.classList.add('active');
        elements.aesAlgo.classList.remove('active');
      }
      showToast('Key loaded! 🔐');
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  keyStorage.updateKeyList();
});