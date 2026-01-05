# Video Summary

[![Project Status: In Progress](https://img.shields.io/badge/status-in%20progress-yellow.svg)]
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-000000?logo=astro&logoColor=white)](https://astro.build/)

An AI-powered web application that automatically generates concise summaries of YouTube videos from your favorite channels. Stay informed without spending hours watching - get the key insights delivered to your dashboard.

## Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Development](#development)
- [📋 Available Scripts](#-available-scripts)
- [🔧 Tech Stack](#-tech-stack)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## ✨ Features

- **🤖 AI-Powered Summaries**: Automatically generate concise TL;DR and detailed summaries using advanced AI models
- **📺 YouTube Integration**: Connect up to 10 YouTube channels and get notified about new videos
- **⏰ Daily Automation**: Automatic daily summary generation for the latest videos from subscribed channels
- **📱 Responsive Dashboard**: Clean, modern interface to browse and manage all your video summaries
- **🔒 Secure Authentication**: Email/password authentication with password reset functionality
- **⭐ Content Rating**: Rate summaries to help improve future recommendations
- **🎯 Smart Filtering**: Filter and search through your summary collection
- **🔄 On-Demand Generation**: Manually trigger summary generation for immediate needs
- **📊 Progress Tracking**: Visual indicators for summary generation status and errors

## 🏗️ Architecture

Video Summary follows a modern serverless architecture built with:

- **Frontend**: Astro + React for optimal performance and SEO
- **Backend**: Cloudflare Functions for serverless API endpoints
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with secure session management
- **AI Integration**: OpenRouter API for flexible AI model selection
- **External APIs**: YouTube Data API for channel and video information

### System Flow

1. **User Management**: Secure authentication and profile management
2. **Channel Subscription**: Users add YouTube channels via URL
3. **Video Discovery**: Automated checking for new videos from subscribed channels
4. **Content Processing**: Transcript extraction and AI-powered summarization
5. **Dashboard Delivery**: Real-time updates and organized summary presentation

## 🔧 Tech Stack

### Frontend
- **[Astro](https://astro.build/)** - Modern web framework for content-driven websites
- **[React 19](https://react.dev/)** - UI library for interactive components
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Modern component library built on Radix UI

### Backend & Infrastructure
- **[Cloudflare Functions](https://workers.cloudflare.com/)** - Serverless API endpoints
- **[Supabase](https://supabase.com/)** - PostgreSQL database with real-time subscriptions and RLS
- **[OpenRouter](https://openrouter.ai/)** - Unified API for multiple AI models
- **[YouTube Data API](https://developers.google.com/youtube/v3)** - Channel and video information

### Development & Quality
- **[Vite](https://vitejs.dev/)** - Fast build tool and development server
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** - Code linting and formatting
- **[Vitest](https://vitest.dev/)** - Fast unit testing framework
- **[Playwright](https://playwright.dev/)** - End-to-end testing
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipelines

## 🚀 Quick Start

Get Video Summary running locally in minutes.

### Prerequisites

- **[Node.js](https://nodejs.org/)** (LTS version 18+ recommended)
- **[npm](https://www.npmjs.com/)** (comes with Node.js)
- **Supabase Account** - For database and authentication
- **YouTube Data API Key** - For YouTube integration
- **OpenRouter API Key** - For AI summarization

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd videosummary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Configuration

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_service_role_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI Services
   OPENROUTER_API_KEY=your_openrouter_api_key
   OPENROUTER_MODEL=gpt-4o-mini  # Optional: defaults to gpt-4o-mini

   # YouTube API
   YOUTUBE_API_KEY=your_youtube_data_api_key

   # Optional: Logging
   LOGTAPE_API_KEY=your_logtape_api_key
   LOGTAPE_PROJECT_ID=your_logtape_project_id
   ```

4. **Configure Supabase**

   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/`
   - Update your environment variables with the Supabase credentials

### Development

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`.

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reloading |
| `npm run build` | Build application for production |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Access Astro CLI commands |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Lint code for errors and style issues |
| `npm run lint:fix` | Automatically fix linting issues |
| `npm run format` | Format code with Prettier |

## 📚 Documentation

### API Reference

The application provides RESTful API endpoints for:

- **Authentication** - User registration, login, and session management
- **Channels** - YouTube channel subscription and management
- **Summaries** - AI-generated video summaries and ratings
- **Videos** - Video discovery and metadata retrieval

### Database Schema

Video Summary uses Supabase with the following main tables:
- `profiles` - User profiles and preferences
- `user_channels` - Subscribed YouTube channels
- `videos` - Video metadata and processing status
- `summaries` - Generated AI summaries with ratings

### Development Guidelines

- Follow TypeScript strict mode for type safety
- Use ESLint and Prettier for code quality
- Write unit tests for business logic with Vitest
- Follow conventional commit messages
- Use the established project structure for consistency

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm run lint && npm run typecheck`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing patterns for component structure
- Add JSDoc comments for complex functions
- Ensure all tests pass before submitting PRs

### Logging & Monitoring

Video Summary uses **LogTape** for production-ready logging with:

- Structured logging with automatic PII redaction
- AWS X-Ray distributed tracing support
- Environment-aware configuration (development vs production)
- Type-safe logging functions with hierarchical categories

For detailed logging documentation, see [`docs/logging.md`](docs/logging.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for providing unified AI API access
- [Supabase](https://supabase.com/) for the excellent backend-as-a-service platform
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Astro](https://astro.build/) for the modern web framework

---

**Video Summary** - Stay informed, save time, never miss important content.
