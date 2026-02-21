const tvCanvas = document.getElementById('tvCanvas');
const tvCtx = tvCanvas.getContext('2d');

const tvImage = new Image();
tvImage.src = 'tv.png';

function drawStatic() {
  const imageData = tvCtx.createImageData(300, 200);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = Math.random() * 255;
    imageData.data[i] = value;
    imageData.data[i+1] = value;
    imageData.data[i+2] = value;
    imageData.data[i+3] = 255;
  }
  tvCtx.putImageData(imageData, 0, 0);

  // Draw the tv image on top
  if (tvImage.complete && tvImage.naturalWidth > 0) {
    tvCtx.drawImage(tvImage, 0, 0, 300, 200);
  }
}

setInterval(drawStatic, 50);