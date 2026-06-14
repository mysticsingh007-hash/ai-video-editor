# AI-Powered Video Editor

A professional AI-powered web application for detecting and removing logos, watermarks, timestamps, channel branding, and overlays from videos.

## Features

### Automatic Detection
- Static logo detection in corners
- Moving logo tracking
- Transparent watermark detection
- Timestamp detection
- TV channel overlay detection
- Visual region highlighting

### Manual Selection
- Draw custom selection boxes
- Multiple region support
- Frame-by-frame adjustment
- Timeline controls

### Removal Methods
- Blur region
- Pixel replacement
- Content-aware fill
- AI inpainting
- Frame interpolation
- Object removal using neighboring frames

### Quality Features
- Original resolution preservation
- Original FPS maintenance
- Audio preservation
- GPU acceleration
- Batch processing support

### Export Options
- MP4, MOV, WebM formats
- Quality selector
- Direct download

## Tech Stack

**Frontend:**
- Next.js 15
- React 19
- Tailwind CSS
- TypeScript

**Backend:**
- Node.js + Express
- FFmpeg
- OpenCV
- TensorFlow.js / PyTorch
- PostgreSQL

**DevOps:**
- Docker
- Docker Compose

## Quick Start

### Prerequisites
- Node.js 18+
- FFmpeg
- Docker & Docker Compose
- PostgreSQL 14+

### Development

```bash
# Clone repository
git clone https://github.com/mysticsingh007-hash/ai-video-editor.git
cd ai-video-editor

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Run with Docker
docker-compose up -d

# Start development server
npm run dev
```

Application will be available at `http://localhost:3000`

### Production

```bash
npm run build
npm start
```

## Project Structure

```
ai-video-editor/
├── frontend/                # Next.js frontend application
│   ├── src/
│   │   ├── app/            # App router
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities and helpers
│   │   ├── types/          # TypeScript types
│   │   └── styles/         # Global styles
│   ├── public/             # Static assets
│   └── package.json
│
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── database/       # Database config & migrations
│   │   ├── processors/     # Video processing logic
│   │   ├── detection/      # Logo/watermark detection
│   │   ├── utils/          # Helper functions
│   │   └── types/          # TypeScript types
│   ├── jobs/               # Background job queue
│   └── package.json
│
├── scripts/                 # Utility scripts
│   ├── ffmpeg-process.js   # FFmpeg wrapper
│   ├── opencv-detect.js    # OpenCV detection
│   └── setup-models.js     # AI model setup
│
├── docker/                  # Docker configuration
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
│
├── docs/                    # Documentation
│   ├── API.md              # API documentation
│   ├── DEPLOYMENT.md       # Deployment guide
│   ├── ARCHITECTURE.md     # System architecture
│   └── SETUP.md            # Setup instructions
│
├── docker-compose.yml      # Docker compose configuration
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
└── package.json            # Root package.json
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/videos/upload` - Upload video
- `GET /api/videos/:id` - Get video details
- `POST /api/videos/:id/detect` - Detect logos/watermarks
- `POST /api/videos/:id/process` - Process video
- `GET /api/jobs/:id` - Get job status
- `GET /api/health` - Health check

See [API_DOCS.md](./docs/API.md) for complete documentation.

## Security

- Automatic file deletion after processing
- No permanent storage of user videos
- JWT-based authentication
- Rate limiting enabled
- Input validation on all endpoints
- CORS protection
- SQL injection prevention with parameterized queries

## Performance

- Multi-threaded processing with Worker threads
- GPU acceleration support (CUDA/ROCm)
- Redis-based job queue
- Background processing with Bull queue
- Resume interrupted renders
- Batch processing capability
- Streaming responses for large files

## Environment Variables

See `.env.example` for all available configuration options.

## Development

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Database Migrations

```bash
cd backend
npm run migrate
```

## Docker Support

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for production deployment guide.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For issues and feature requests, please visit the [Issues](https://github.com/mysticsingh007-hash/ai-video-editor/issues) page.

## Authors

- **Mystic Singh** - Initial work

## Acknowledgments

- FFmpeg for video processing
- OpenCV for computer vision
- TensorFlow.js for AI models
