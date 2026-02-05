import { Palette } from 'lucide-react';

const colors = [
  '#000000', '#FFFFFF', '#FF3B30', '#FF9500', '#FFCC00',
  '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55',
  '#8E8E93', '#EFEFF4', '#C7C7CC', '#D1D1D6', '#E5E5EA'
];

const ColorPicker = ({ selectedColor, onColorChange }) => {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-5 h-5" />
        <span className="font-medium">Colors</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-8 h-8 rounded-full border-2 ${
              selectedColor === color 
                ? 'border-gray-800 scale-110' 
                : 'border-gray-300 hover:border-gray-500'
            } transition-all`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <div className="mt-3">
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-full h-10 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ColorPicker;