// Draw line between points
export const drawLine = (ctx, points, color, brushSize) => {
  if (points.length < 2) return;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  
  ctx.stroke();
};

// Draw rectangle
export const drawRectangle = (ctx, start, end, color, brushSize) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
};

// Draw circle
export const drawCircle = (ctx, start, end, color, brushSize) => {
  const radius = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  );
  
  ctx.strokeStyle = color;
  ctx.lineWidth = brushSize;
  ctx.beginPath();
  ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
  ctx.stroke();
};

// Draw text
export const drawText = (ctx, position, text, color, fontSize) => {
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px Arial`;
  ctx.fillText(text, position.x, position.y);
};

// Clear canvas
export const clearCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

// Get mouse position relative to canvas
export const getMousePos = (canvas, evt) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
};