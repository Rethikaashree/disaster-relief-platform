/**
 * Generates an SVG / Canvas QR representation of a beneficiary ID token
 */
export function drawQrCodeToCanvas(canvas: HTMLCanvasElement, text: string, size: number = 220) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = size;
  canvas.height = size;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Border & Brand Frame
  ctx.strokeStyle = '#0B3D91';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, size - 12, size - 12);

  // Pseudo Matrix Grid derived from string hash
  const gridSize = 19;
  const cellSize = (size - 32) / gridSize;

  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i) * (i + 1);
  }

  // Draw QR Corner Position Patterns
  const drawPositionPattern = (x: number, y: number) => {
    ctx.fillStyle = '#0B3D91';
    ctx.fillRect(x, y, cellSize * 5, cellSize * 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + cellSize, y + cellSize, cellSize * 3, cellSize * 3);
    ctx.fillStyle = '#00BCD4';
    ctx.fillRect(x + cellSize * 1.8, y + cellSize * 1.8, cellSize * 1.4, cellSize * 1.4);
  };

  drawPositionPattern(16, 16); // Top-Left
  drawPositionPattern(size - 16 - cellSize * 5, 16); // Top-Right
  drawPositionPattern(16, size - 16 - cellSize * 5); // Bottom-Left

  // Draw Matrix Data Cells
  ctx.fillStyle = '#0F172A';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip corner areas
      if ((r < 6 && c < 6) || (r < 6 && c > gridSize - 7) || (r > gridSize - 7 && c < 6)) {
        continue;
      }
      
      const pseudoVal = (seed * (r + 1) * (c + 3)) % 100;
      if (pseudoVal > 42) {
        const posX = 16 + c * cellSize;
        const posY = 16 + r * cellSize;
        ctx.fillRect(posX, posY, cellSize - 0.5, cellSize - 0.5);
      }
    }
  }

  // Center Seal / Logo overlay
  const centerSize = cellSize * 3.5;
  const centerX = (size - centerSize) / 2;
  const centerY = (size - centerSize) / 2;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(centerX - 2, centerY - 2, centerSize + 4, centerSize + 4);
  ctx.fillStyle = '#0B3D91';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, centerSize / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00BCD4';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GOV', size / 2, size / 2);
}
