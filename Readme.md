# Arduboy Pixels

A modern web-based sprite and composition editor specifically designed for the Arduboy handheld gaming platform. Create, edit, and export pixel art with powerful tools optimized for the Arduboy's 128x64 monochrome display.

## Features

### 🎨 **Drawing Tools**
- **Pencil Tool** with black/white color switching (press `X`)
- **Eraser** with adjustable size
- **Fill Tool** for flood filling areas
- **Shape Tools**: Line, Rectangle, Circle (filled and outline variants)
- **Invert Tool** for reversing pixel colors in selections
- **Brush Styles**: Square and round brushes with size control

### 🖼️ **Sprite Editor**
- Create sprites and screens with custom dimensions
- Multiple preset sizes with x64 zoom for detailed work
- Real-time grid overlay with snap-to-grid functionality
- Zoom controls from 1x to 128x with scroll-to-zoom support
- Undo/Redo system with 50-step history

### 🎬 **Composition System**
- Layer-based composition editor
- Drag-and-drop sprite positioning
- Z-index layer ordering
- Layer duplication with automatic grid positioning
- Fit-to-screen zoom functionality
- Persistent zoom levels per composition

### ⌨️ **Keyboard Shortcuts**
- `P` - Pencil tool
- `E` - Eraser tool
- `F` - Fill tool
- `L` - Line tool
- `R` - Rectangle tool
- `C` - Circle tool
- `I` - Invert tool
- `G` - Toggle grid
- `X` - Switch pencil colors (black/white) or toggle pencil/eraser
- `[` / `]` - Decrease/increase brush size
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` / `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + D` - Duplicate layer (in composition mode)
- `Ctrl/Cmd + +/-/0` - Zoom in/out/reset

### 💾 **Project Management**
- Hierarchical project structure with folders
- Auto-save functionality (30-second intervals)
- Export to PROGMEM format for Arduino code
- Import/Export project data
- Sprite resizing with pixel preservation
- Item duplication and organization

### 🔧 **Advanced Features**
- Mouse wheel zoom in both editors
- Background processes for smooth performance
- Responsive design for various screen sizes
- Local storage persistence
- Hot module replacement for development

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/devchew/arduboy-pixels.git
cd arduboy-pixels
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173` (or the port shown in terminal)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Creating Your First Sprite

1. **Create a New Sprite**: Click the "+" button in the file explorer and select "New Sprite"
2. **Choose Dimensions**: Select from presets or enter custom width/height
3. **Start Drawing**: Use the pencil tool to draw pixels
4. **Switch Colors**: Press `X` to toggle between black and white
5. **Save Automatically**: Your work is auto-saved every 30 seconds

### Working with Compositions

1. **Create a Composition**: Add a new composition from the file explorer
2. **Add Sprites**: Drag sprites from the project tree to the composition
3. **Layer Management**: Use the layer panel to reorder, hide, or duplicate layers
4. **Positioning**: Drag sprites on the canvas or use the layer panel for precise positioning

### Exporting for Arduboy

1. **Select Your Sprite**: Click on the sprite in the file explorer
2. **Export Dialog**: Click the export button in the toolbar
3. **Choose Format**: Select PROGMEM format for Arduino compatibility
4. **Copy Code**: Use the generated C++ code in your Arduboy sketch

## Technical Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Canvas Rendering**: HTML5 Canvas API
- **State Management**: React Hooks + Local Storage

## Project Structure

```
src/
├── components/          # React components
│   ├── Canvas.tsx      # Main drawing canvas
│   ├── Toolbar.tsx     # Drawing tools toolbar
│   ├── FileExplorer.tsx # Project file management
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useCanvas.ts    # Canvas drawing logic
│   └── useProject.ts   # Project state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── drawing.ts      # Drawing algorithms
│   └── export.ts       # Export functionality
└── ...
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the [Arduboy](https://arduboy.com/) community
- Inspired by classic pixel art editors
- Uses modern web technologies for a smooth editing experience

## Development Notes

### Recent Updates
- ✅ Added pencil color switching (black/white)
- ✅ Implemented scroll-to-zoom functionality
- ✅ Added x64 zoom preset for detailed work
- ✅ Enhanced composition system with layer management
- ✅ Improved keyboard shortcuts and user experience

### Performance Features
- Hot module replacement for fast development
- Efficient canvas rendering with minimal redraws
- Optimized state management with proper React patterns
- Background auto-saving without blocking UI

---

**Happy pixel art creation! 🎮✨**
