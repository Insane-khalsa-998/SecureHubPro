const imageInput = document.getElementById("imageInput");
const messageInput = document.getElementById("messageInput");
const encodeBtn = document.getElementById("encodeBtn");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const downloadLink = document.getElementById("downloadLink");

let currentImage = null;

// Convert string to binary
function stringToBinary(str) {
  let bin = '';
  for (let i = 0; i < str.length; i++) {
    bin += str[i].charCodeAt(0).toString(2).padStart(8, '0');
  }
  return bin + '00000000'; // Null terminator
}

// LSB Encode: embed binary data into image pixels
function lsbEncode(imageData, binary) {
  const data = imageData.data;
  let bitIndex = 0;

  for (let i = 0; i < data.length && bitIndex < binary.length; i++) {
    if ((data[i] & 1) !== parseInt(binary[bitIndex], 10)) {
      data[i] ^= 1; // Flip the LSB
    }
    bitIndex++;
  }

  if (bitIndex < binary.length) {
    alert("Message too long for this image!");
  }

  return imageData;
}

// Handle encode button click
encodeBtn.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (!currentImage) {
    alert("Please select an image first.");
    return;
  }
  if (!message) {
    alert("Please enter a message to hide.");
    return;
  }

  const binary = stringToBinary(message);

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let encodedData = lsbEncode(imageData, binary);

    ctx.putImageData(encodedData, 0, 0);
    downloadLink.href = canvas.toDataURL("image/png");
    downloadLink.classList.remove("d-none");
    downloadLink.download = "secret_message.png";
  };

  img.src = URL.createObjectURL(currentImage);
});

// Load selected image preview
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith("image/png")) {
    alert("Please select a PNG image.");
    return;
  }

  currentImage = file;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});