# Chess Engine - Modern Chess Application with AI

A modern chess application with AI coaching capabilities, built using Next.js 15, React 19, TypeScript, and a robust multi-engine AI system.

## 🎯 Features

- **Professional Chess Game**: Complete chess implementation with move validation
- **Multi-Engine AI System**:
  - **Primary**: Stockfish WASM (~3000+ Elo) - World-class chess engine
  - **Fallback**: Advanced JavaScript AI (~1500 Elo) - Custom implementation
  - **Final Fallback**: Simple Engine - Basic chess.js moves
- **Evaluation Bar**: Real-time position evaluation display
- **Difficulty Levels**: Easy, Medium, Hard with adjustable AI strength
- **Modern UI**: Beautiful, responsive interface with Tailwind CSS
- **Client-Only Architecture**: No SSR issues, optimized performance

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chess_engine
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup Stockfish (Optional but Recommended)**

   For maximum AI strength, download `stockfish.js`:

   ```bash
   # Option 1: Download from official Stockfish website
   curl -o public/stockfish.js https://stockfishchess.org/files/stockfish.js

   # Option 2: Copy from npm package (if available)
   cp node_modules/stockfish/stockfish.js public/
   ```

   **Note**: If `stockfish.js` is not available, the system will automatically use the Advanced JavaScript AI fallback.

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Play

1. **Start a Game**: The board loads with the standard chess starting position
2. **Make Moves**: Click on a piece and then click on a valid square to move
3. **Enable AI**: Toggle the AI opponent switch to play against the computer
4. **Choose Difficulty**: Select Easy, Medium, or Hard difficulty levels
5. **Auto-Play**: Enable auto-play for automatic AI moves
6. **Evaluation**: Watch the evaluation bar on the left for position assessment

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15 with App Router
- **UI**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Chess Logic**: chess.js
- **AI Engines**:
  - Stockfish WASM (Web Worker)
  - Custom Advanced JavaScript AI
  - Simple Fallback Engine

### Key Components

- `ChessGame`: Main game orchestrator
- `ChessBoard`: Interactive chess board with react-chessboard
- `AIOpponent`: AI opponent logic and UI
- `ChessEngineContext`: Engine state management with fallback system
- `EvaluationBar`: Real-time position evaluation display

### Engine System

The application uses a sophisticated multi-engine system:

1. **Stockfish WASM** (Primary)

   - Runs in a Web Worker for non-blocking performance
   - Provides world-class chess analysis (~3000+ Elo)
   - Requires `stockfish.js` in the `public/` directory

2. **Advanced JavaScript AI** (First Fallback)

   - Custom implementation with advanced algorithms
   - Includes minimax with alpha-beta pruning
   - Provides strong play (~1500 Elo)

3. **Simple Engine** (Final Fallback)
   - Basic chess.js-based move generation
   - Ensures the game always works

## 🔧 Configuration

### AI Difficulty Settings

```typescript
// Easy: Quick moves, lower depth
{ maxDepth: 5, maxTimeMs: 800, skillLevel: 20 }

// Medium: Balanced performance
{ maxDepth: 6, maxTimeMs: 1200, skillLevel: 20 }

// Hard: Maximum strength
{ maxDepth: 7, maxTimeMs: 2000, skillLevel: 20 }
```

### Engine Configuration

The system automatically detects and uses the best available engine:

1. **Stockfish** (if `stockfish.js` is available)
2. **Advanced JS AI** (if Stockfish fails)
3. **Simple Engine** (if both fail)

## 📁 Project Structure

```
chess_engine/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   │   ├── ChessBoard.tsx   # Chess board component
│   │   ├── AIOpponent.tsx   # AI opponent logic
│   │   └── EvaluationBar.tsx # Position evaluation
│   ├── contexts/            # React contexts
│   │   ├── ChessContext.tsx # Game state management
│   │   └── ChessEngineContext.tsx # AI engine management
│   ├── lib/                 # Core libraries
│   │   ├── chess.ts         # Chess game logic
│   │   ├── stockfish-engine.ts # Stockfish adapter
│   │   ├── stockfish-worker.ts # Stockfish Web Worker
│   │   ├── advanced-chess-ai.ts # Advanced JS AI
│   │   └── simple-fallback-engine.ts # Simple fallback
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
│   └── stockfish.js         # Stockfish WASM (optional)
├── docs/                    # Project documentation
└── package.json
```

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

No environment variables are required. The application works entirely client-side.

### Hosting

The application can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **GitHub Pages**: Configure in repository settings

## 🧪 Testing

### Manual Testing

1. **Basic Gameplay**: Test move validation and game rules
2. **AI Functionality**: Test AI moves at different difficulty levels
3. **Fallback System**: Test with and without `stockfish.js`
4. **Responsive Design**: Test on different screen sizes

### Automated Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Build test
npm run build
```

## 🐛 Troubleshooting

### Common Issues

1. **AI Not Working**

   - Check browser console for errors
   - Ensure `stockfish.js` is in `public/` directory (optional)
   - The system will automatically fall back to JS AI

2. **Slow Performance**

   - Disable auto-play for manual moves
   - Reduce AI difficulty level
   - Check browser Web Worker support

3. **Build Errors**
   - Clear `.next` directory: `rm -rf .next`
   - Reinstall dependencies: `npm install`
   - Check Node.js version (requires 18+)

### Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile**: Responsive design supported

## 📚 Documentation

- [Task Manager](./docs/TASK_MANAGER.md) - Development progress and decisions
- [Project Summary](./docs/PROJECT_SUMMARY.md) - Technical overview
- [Architecture](./docs/ARCHITECTURE.md) - System design
- [AI Design](./docs/AI_DESIGN.md) - AI engine specifications
- [Deployment](./docs/DEPLOYMENT.md) - Deployment guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm run lint && npm run build`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stockfish](https://stockfishchess.org/) - World's strongest chess engine
- [chess.js](https://github.com/jhlywa/chess.js) - Chess game logic library
- [react-chessboard](https://github.com/Clariity/react-chessboard) - Chess board component
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 📞 Support

For questions, issues, or contributions:

1. Check the [documentation](./docs/)
2. Search existing [issues](../../issues)
3. Create a new [issue](../../issues/new)

---

**Happy Chess Playing! ♟️**
