import { 
  Pencil, Square, Circle, Type, Eraser, 
  Undo, Trash2, Minus, Plus, Users,
  Save, Share2
} from 'lucide-react';

const tools = [
  { id: 'pencil', name: 'Pencil', icon: Pencil },
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'circle', name: 'Circle', icon: Circle },
  { id: 'text', name: 'Text', icon: Type },
  { id: 'eraser', name: 'Eraser', icon: Eraser },
];

const Toolbar = ({ 
  activeTool, 
  onToolChange, 
  brushSize, 
  onBrushSizeChange,
  onUndo,
  onClear,
  onSave,
  onShare,
  userCount
}) => {
  return (
    <div className="h-full p-4 overflow-y-auto bg-white shadow-lg rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Pencil className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">CollabBoard</h1>
            <p className="text-sm text-gray-600">Real-time whiteboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <Users className="w-4 h-4" />
            <span className="font-medium">{userCount}</span>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="mb-6">
        <h3 className="mb-3 font-medium text-gray-700">Drawing Tools</h3>
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                activeTool === tool.id 
                  ? 'bg-blue-100 text-blue-600 border border-blue-300' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={tool.name}
            >
              <tool.icon className="w-6 h-6 mb-1" />
              <span className="text-xs">{tool.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Brush Size */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700">Brush Size</span>
          <span className="text-sm text-gray-600">{brushSize}px</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onBrushSizeChange(Math.max(1, brushSize - 2))}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
            className="flex-1"
          />
          <button
            onClick={() => onBrushSizeChange(Math.min(50, brushSize + 2))}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-700">Actions</h3>
        <button
          onClick={onUndo}
          className="flex items-center justify-center w-full gap-2 p-3 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          <Undo className="w-5 h-5" />
          <span>Undo Last Action</span>
        </button>
        
        <button
          onClick={onClear}
          className="flex items-center justify-center w-full gap-2 p-3 text-red-600 transition-colors rounded-lg bg-red-50 hover:bg-red-100"
        >
          <Trash2 className="w-5 h-5" />
          <span>Clear Canvas</span>
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSave}
            className="flex items-center justify-center gap-2 p-3 text-blue-600 transition-colors rounded-lg bg-blue-50 hover:bg-blue-100"
          >
            <Save className="w-5 h-5" />
            <span>Save</span>
          </button>
          
          <button
            onClick={onShare}
            className="flex items-center justify-center gap-2 p-3 text-green-600 transition-colors rounded-lg bg-green-50 hover:bg-green-100"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;