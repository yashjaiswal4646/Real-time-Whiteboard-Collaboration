import { useState, useEffect, useRef } from 'react';

const Whiteboard = ({ 
  drawings, 
  onDraw, 
  tool, 
  color, 
  brushSize,
  users,
  onCursorMove
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawing = useRef(false);
  const startPoint = useRef(null);
  const currentPoints = useRef([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Initialize canvas and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Ensure minimum dimensions
        const minWidth = 400;
        const minHeight = 300;
        setDimensions({
          width: Math.max(minWidth, Math.floor(width)),
          height: Math.max(minHeight, Math.floor(height))
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Draw all drawings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all saved drawings
    drawings.forEach(drawing => {
      drawOnCanvas(ctx, drawing);
    });

    // Draw user cursors
    users.forEach(user => {
      if (user.cursor && user.cursor.x && user.cursor.y) {
        drawCursor(ctx, user);
      }
    });
  }, [drawings, users, dimensions]);

  const drawOnCanvas = (ctx, drawing) => {
    ctx.strokeStyle = drawing.color;
    ctx.fillStyle = drawing.color;
    ctx.lineWidth = drawing.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawing.tool === 'pencil' || drawing.tool === 'eraser') {
      if (drawing.points.length < 2) return;
      
      ctx.beginPath();
      ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
      
      for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
      }
      
      ctx.stroke();
    } 
    else if (drawing.tool === 'rectangle') {
      if (drawing.points.length < 2) return;
      const start = drawing.points[0];
      const end = drawing.points[1];
      const width = end.x - start.x;
      const height = end.y - start.y;
      ctx.strokeRect(start.x, start.y, width, height);
    } 
    else if (drawing.tool === 'circle') {
      if (drawing.points.length < 2) return;
      const start = drawing.points[0];
      const end = drawing.points[1];
      const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    else if (drawing.tool === 'text') {
      if (!drawing.text || drawing.points.length < 1) return;
      ctx.font = `${drawing.brushSize * 3}px Arial`;
      ctx.fillText(drawing.text, drawing.points[0].x, drawing.points[0].y);
    }
  };

  const drawCursor = (ctx, user) => {
    ctx.fillStyle = user.color;
    ctx.beginPath();
    ctx.arc(user.cursor.x, user.cursor.y, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  // Get coordinates from both mouse and touch events
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.type.includes('touch')) {
      // Handle touch events
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Handle mouse events
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    // Prevent default to avoid scrolling while drawing on mobile
    e.preventDefault();
    
    const point = getCoordinates(e);
    startPoint.current = point;
    currentPoints.current = [point];
    
    if (tool === 'text') {
      // For text tool, immediately ask for text input
      const text = prompt('Enter text:', 'Hello');
      if (text) {
        // Send the drawing with text content
        onDraw([point], color, brushSize, 'text', text);
      }
      return;
    }
    
    isDrawing.current = true;
    
    // Send cursor position
    if (onCursorMove) {
      onCursorMove(point.x, point.y);
    }
  };

  const draw = (e) => {
    if (!isDrawing.current || !startPoint.current) return;
    
    // Prevent default to avoid scrolling while drawing on mobile
    e.preventDefault();
    
    const point = getCoordinates(e);
    
    // Send cursor position
    if (onCursorMove) {
      onCursorMove(point.x, point.y);
    }
    
    // For shape tools (rectangle, circle), show preview but don't send yet
    if (tool === 'rectangle' || tool === 'circle') {
      // Store current end point for preview
      currentPoints.current = [startPoint.current, point];
      
      // Redraw canvas with preview
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      
      // Clear and redraw all saved drawings
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      drawings.forEach(drawing => {
        drawOnCanvas(ctx, drawing);
      });
      
      // Draw preview
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([5, 5]); // Dashed line for preview
      
      if (tool === 'rectangle') {
        const start = startPoint.current;
        const end = point;
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.strokeRect(start.x, start.y, width, height);
      } else if (tool === 'circle') {
        const start = startPoint.current;
        const end = point;
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.setLineDash([]); // Reset to solid line
      
    } else if (tool === 'pencil' || tool === 'eraser') {
      // For pencil/eraser, send continuous points
      currentPoints.current.push(point);
      
      // Send the drawing points
      onDraw(currentPoints.current, color, brushSize, tool);
    }
  };

  const stopDrawing = (e) => {
    if (!isDrawing.current || !startPoint.current) return;
    
    // Prevent default to avoid scrolling while drawing on mobile
    if (e) e.preventDefault();
    
    if (tool === 'rectangle' || tool === 'circle') {
      // Send the final shape
      const point = e ? getCoordinates(e) : startPoint.current;
      onDraw([startPoint.current, point], color, brushSize, tool);
    } else if (tool === 'pencil' || tool === 'eraser') {
      // For pencil/eraser, the points are already sent in draw()
      // Just ensure we send the last point if needed
      if (currentPoints.current.length > 0) {
        onDraw(currentPoints.current, color, brushSize, tool);
      }
    }
    
    isDrawing.current = false;
    startPoint.current = null;
    currentPoints.current = [];
  };

  // Prevent context menu on long press (mobile)
  const preventContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-white rounded-lg"
      style={{ touchAction: 'none' }} // Important for mobile touch handling
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair"
        // Mouse events
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        // Touch events for mobile
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
        // Prevent context menu on long press
        onContextMenu={preventContextMenu}
      />
      
      {/* Tool indicator */}
      <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
        <span>
          {tool === 'pencil' && '✏️ Pencil'}
          {tool === 'rectangle' && '⬜ Rectangle'}
          {tool === 'circle' && '⭕ Circle'}
          {tool === 'text' && '📝 Text'}
          {tool === 'eraser' && '🧽 Eraser'}
        </span>
        <span className="text-gray-300">| {brushSize}px</span>
      </div>
    </div>
  );
};

export default Whiteboard;