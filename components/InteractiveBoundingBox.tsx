import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PixelBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface InteractiveBoundingBoxProps {
  pixelBox: PixelBox;
  label: string;
  onBoxChange: (newPixelBox: PixelBox) => void;
  onToggle: () => void;
  bounds: PixelBox; // The container area for the box, in pixels relative to the same parent
}

type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MIN_SIZE = 40; // Minimum pixel size for width and height

export const InteractiveBoundingBox: React.FC<InteractiveBoundingBoxProps> = ({
  pixelBox,
  label,
  onBoxChange,
  onToggle,
  bounds,
}) => {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<Handle | null>(null);
  const startPosRef = useRef({ 
      x: 0, 
      y: 0, 
      boxX: 0, 
      boxY: 0,
      boxW: 0,
      boxH: 0,
      boxCoords: [0,0,0,0] as [number, number, number, number] 
  });

  const getClientCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number; y: number } => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const { x, y } = getClientCoords(e);
    setDragging(true);
    startPosRef.current = {
      x,
      y,
      boxX: pixelBox.left,
      boxY: pixelBox.top,
      boxW: pixelBox.width,
      boxH: pixelBox.height,
      boxCoords: [0,0,0,0], // Not needed for drag
    };
  };
  
  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, handle: Handle) => {
    e.stopPropagation();
    const { x, y } = getClientCoords(e);
    setResizing(handle);
    startPosRef.current = {
        x,
        y,
        boxX: 0, boxY: 0, boxW: 0, boxH: 0, // Not needed for resize
        boxCoords: [pixelBox.top, pixelBox.left, pixelBox.top + pixelBox.height, pixelBox.left + pixelBox.width]
    };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
        // Prevent page scroll on mobile when dragging/resizing
        if (e.cancelable) {
            e.preventDefault();
        }

        const { x, y } = getClientCoords(e);
        
        if (dragging) {
            const dx = x - startPosRef.current.x;
            const dy = y - startPosRef.current.y;
          
            const newLeft = Math.max(bounds.left, Math.min(startPosRef.current.boxX + dx, bounds.left + bounds.width - startPosRef.current.boxW));
            const newTop = Math.max(bounds.top, Math.min(startPosRef.current.boxY + dy, bounds.top + bounds.height - startPosRef.current.boxH));
    
            onBoxChange({ top: newTop, left: newLeft, width: pixelBox.width, height: pixelBox.height });

        } else if (resizing) {
            const dx = x - startPosRef.current.x;
            const dy = y - startPosRef.current.y;
            let [y1, x1, y2, x2] = startPosRef.current.boxCoords;
      
            if (resizing.includes('n')) y1 = Math.min(y2 - MIN_SIZE, Math.max(bounds.top, y1 + dy));
            if (resizing.includes('s')) y2 = Math.max(y1 + MIN_SIZE, Math.min(bounds.top + bounds.height, y2 + dy));
            if (resizing.includes('w')) x1 = Math.min(x2 - MIN_SIZE, Math.max(bounds.left, x1 + dx));
            if (resizing.includes('e')) x2 = Math.max(x1 + MIN_SIZE, Math.min(bounds.left + bounds.width, x2 + dx));
    
            onBoxChange({ top: y1, left: x1, width: x2 - x1, height: y2 - y1 });
        }
    };

    const handleEnd = () => {
        setDragging(false);
        setResizing(null);
    };

    if (dragging || resizing) {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('touchcancel', handleEnd);
    }
    
    return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
        window.removeEventListener('touchcancel', handleEnd);
    };
  }, [dragging, resizing, onBoxChange, bounds, pixelBox]);

  const handles: Handle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  
  return (
    <div
      className="absolute border-2 rounded-sm touch-none"
      style={{
        top: `${pixelBox.top}px`,
        left: `${pixelBox.left}px`,
        width: `${pixelBox.width}px`,
        height: `${pixelBox.height}px`,
        borderColor: 'rgb(250 204 21)',
        boxShadow: '0 0 10px rgba(250, 204, 21, 0.5)',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
        <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="absolute -top-3 -right-3 bg-gray-900 border-2 border-yellow-400 text-yellow-400 rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-yellow-400 hover:text-gray-900 z-20">
            &times;
        </button>
         <div className="absolute top-0 left-0 -translate-y-full bg-yellow-400 text-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-t-sm">
            {label}
        </div>
        {handles.map(handle => {
            const cursorMap: Record<Handle, string> = {
                n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
                ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize'
            };
            return (
                <div 
                    key={handle}
                    onMouseDown={(e) => handleResizeStart(e, handle)}
                    onTouchStart={(e) => handleResizeStart(e, handle)}
                    className="absolute w-3 h-3 bg-yellow-400 border border-gray-900 rounded-full z-10"
                    style={{
                        top: handle.includes('n') ? '-6px' : handle.includes('s') ? 'calc(100% - 6px)' : 'calc(50% - 6px)',
                        left: handle.includes('w') ? '-6px' : handle.includes('e') ? 'calc(100% - 6px)' : 'calc(50% - 6px)',
                        cursor: cursorMap[handle],
                    }}
                />
            )
        })}
    </div>
  );
};