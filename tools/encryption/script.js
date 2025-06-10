const plaintext = document.getElementById("plaintext");
const result = document.getElementById("result");
const algorithmSelect = document.getElementById("algorithm");
const encryptBtn = document.getElementById("encryptBtn");
const decryptBtn = document.getElementById("decryptBtn");
const keyInput = document.getElementById("key");

// Generate random hex key of specified length
function generateKey(length = 32) {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert hex string to ArrayBuffer
function hexToArrayBuffer(hex) {
  const buffer = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    buffer[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return buffer.buffer;
}

// Convert ArrayBuffer to hex string
function arrayBufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert string to ArrayBuffer
function stringToArrayBuffer(str) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Convert ArrayBuffer to string
function arrayBufferToString(buffer) {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

// Get cipher key based on selected algorithm
async function getCipherKey(algorithmName, keyHex) {
  let length = algorithmName === "AES-256" ? 32 : 8;
  if (!keyHex || keyHex.length !== length * 2) {
    keyHex = generateKey(length);
    keyInput.value = keyHex;
  }

  const keyBuffer = hexToArrayBuffer(keyHex);
  const algo = algorithmName === "AES-256"
    ? { name: "AES-CBC", length: 256 }
    : { name: "DES-CBC" };

  return await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    algo,
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt data
async function encrypt() {
  const text = plaintext.value.trim();
  if (!text) return;

  const algorithmName = algorithmSelect.value;
  const keyHex = keyInput.value;
  const key = await getCipherKey(algorithmName, keyHex);

  const iv = crypto.getRandomValues(new Uint8Array(16)); // IV = 16 bytes
  const encoded = stringToArrayBuffer(text);

  const encrypted = await crypto.subtle.encrypt(
    { name: algorithmName === "AES-256" ? "AES-CBC" : "DES-CBC", iv },
    key,
    encoded
  );

  const ivHex = arrayBufferToHex(iv.buffer);
  const encryptedHex = arrayBufferToHex(encrypted);
  result.value = `${ivHex}:${encryptedHex}`;
}

// Decrypt data
async function decrypt() {
  const data = result.value.trim();
  if (!data) return;

  const parts = data.split(":");
  if (parts.length !== 2) {
    alert("Invalid format. Expected: <IV>:<EncryptedData>");
    return;
  }

  const [ivHex, encryptedHex] = parts;
  const algorithmName = algorithmSelect.value;
  const keyHex = keyInput.value;
  const key = await getCipherKey(algorithmName, keyHex);

  const iv = hexToArrayBuffer(ivHex);
  const encrypted = hexToArrayBuffer(encryptedHex);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: algorithmName === "AES-256" ? "AES-CBC" : "DES-CBC", iv },
      key,
      encrypted
    );
    plaintext.value = arrayBufferToString(decrypted);
  } catch (e) {
    alert("Decryption failed. Check key or input.");
    console.error(e);
  }
}

// Event Listeners
encryptBtn.addEventListener("click", encrypt);
decryptBtn.addEventListener("click", decrypt);