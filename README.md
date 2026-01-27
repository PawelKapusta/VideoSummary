# Video Summary

[![Project Status: In Progress](https://img.shields.io/badge/status-in%20progress-yellow.svg)]
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Astro](https://img.shields.io/badge/Astro-000000?logo=astro&logoColor=white)](https://astro.build/)

An AI-powered web application that automatically generates concise summaries of YouTube videos from your favorite channels. Stay informed without spending hours watching - get the key insights delivered to your dashboard.

## 🌐 Live Deployment

**Video Summary is now live and accessible at [https://videosummary.org/](https://videosummary.org/)**

The domain has been acquired specifically for this project, providing a production-ready instance with full automation and enterprise-grade infrastructure.

### Production Environment Features

- **Automated Processing**: Daily summary generation and background queue processing via scheduled cron jobs
- **Enterprise Security**: Production-grade authentication with Supabase Auth and secure session management
- **Real-time Dashboard**: Live updates and instant notifications for new video summaries
- **Scalable Architecture**: Serverless backend infrastructure with Cloudflare Functions and Supabase database

**Ready to get started?** Visit [https://videosummary.org/](https://videosummary.org/) to begin using Video Summary immediately, or follow the local development setup below.

## Table of Contents

- [🌐 Live Deployment](#-live-deployment)
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
- **[Vitest](https://vitest.dev/)** + **[MSW](https://mswjs.io/)** - Fast unit & integration testing with API mocking
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Component testing focused on user interactions
- **[Playwright](https://playwright.dev/)** - E2E testing with Visual Regression capabilities
- **[Storybook](https://storybook.js.org/)** - UI component development and isolation
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

6. **Process summary queue (when needed)**

   ```bash
   # First, make sure the dev server is running in another terminal
   npm run dev

   # Then in a new terminal, process next queue item
   npm run process-queue

   # Or process all pending queue items
   npm run process-queue-all
   ```

   **Note**: Summary generation uses a queue system processed by GitHub Actions cron jobs in production. For local development, use these scripts to manually process pending summaries. The development server must be running (no additional authentication required for local access).

   **Bulk Generation Status**: Check status with `npm run check-bulk-status status` or reset stuck processes with `npm run check-bulk-status reset`.

## 📋 Available Scripts

| Command                            | Description                                 |
| ---------------------------------- | ------------------------------------------- |
| `npm run dev`                      | Start development server with hot reloading |
| `npm run build`                    | Build application for production            |
| `npm run preview`                  | Preview production build locally            |
| `npm run astro`                    | Access Astro CLI commands                   |
| `npm run typecheck`                | Run TypeScript type checking                |
| `npm run lint`                     | Lint code for errors and style issues       |
| `npm run lint:fix`                 | Automatically fix linting issues            |
| `npm run format`                   | Format code with Prettier                   |
| `npm run test`                     | Run unit tests with Vitest                  |
| `npm run test:watch`               | Run unit tests in watch mode                |
| `npm run test:e2e`                 | Run end-to-end tests with Playwright        |
| `npm run test:e2e:ui`              | Run E2E tests in UI mode                    |
| `npm run process-queue`            | Process next pending summary from queue     |
| `npm run process-queue-all`        | Process all pending summaries from queue    |
| `npm run check-bulk-status status` | Check bulk generation status                |
| `npm run check-bulk-status reset`  | Reset stuck bulk generation status          |
| `npm run check-bulk-status-cli`    | Check/reset status via Supabase CLI         |

## ⚙️ GitHub Actions Workflows

VideoSummary uses GitHub Actions for automated background processing. The workflows are designed to run in production and handle summary generation without manual intervention.

### Daily Summary Generation (`daily-summary-generation.yml`)

**Purpose**: Automatically generates summaries for the latest videos from all subscribed channels once per day.

- **Trigger**: Daily at 18:00 UTC (19:00 CET / 20:00 CEST)
- **Manual trigger**: Can be run manually via GitHub Actions UI or API
- **Process**:
  1. Queues videos for summary generation using `/api/summaries/generate-all`
  2. Processes up to 50 queued items sequentially
  3. Handles long-running tasks (up to 6 hours timeout)
- **Authentication**: Uses `CRON_SECRET` for API access

### Process Summary Queue (`process-summary-queue.yml`)

**Purpose**: Processes individual summary generation requests from the queue.

- **Trigger**: Every 10 minutes (continuous background processing)
- **Manual trigger**: Can be run manually via GitHub Actions UI or API
- **Process**:
  1. Processes one queue item at a time using `/api/summaries/process-next`
  2. Handles long-running AI tasks (up to 10 minutes per item)
  3. Supports Gradio transcription tasks that may take 5-10 minutes
- **Authentication**: Uses `CRON_SECRET` for API access

### Alternative: External Cron Services

Instead of GitHub Actions, you can use external cron services to trigger the same endpoints. We recommend [cron-job.org](https://cron-job.org/en/) - a free, reliable cron service.

#### cron-job.org Setup

1. **Create account** at [cron-job.org](https://cron-job.org/en/)
2. **Add two jobs**:

**Daily Summary Generation:**

- **URL**: `https://your-domain.com/api/summaries/generate-all`
- **Method**: `POST`
- **Schedule**: `0 18 * * *` (daily at 18:00 UTC)
- **Headers**:
  ```
  x-cron-secret: YOUR_CRON_SECRET
  Content-Type: application/json
  ```

**Queue Processing:**

- **URL**: `https://your-domain.com/api/summaries/process-next`
- **Method**: `POST`
- **Schedule**: `*/10 * * * *` (every 10 minutes)
- **Headers**:
  ```
  x-cron-secret: YOUR_CRON_SECRET
  Content-Type: application/json
  ```

#### cron-job.org Features

- ✅ **Free tier**: Up to 60 executions per hour
- ✅ **Reliable execution**: CO₂-neutral servers, 15+ years in service
- ✅ **Monitoring**: Execution history, status notifications, failure alerts
- ✅ **Custom headers**: Support for authentication headers like `x-cron-secret`
- ✅ **Test runs**: Test your jobs before scheduling
- ✅ **REST API**: Manage jobs programmatically if needed

#### Benefits over GitHub Actions

- **Independent of GitHub**: No dependency on GitHub Actions limits or pricing
- **Better monitoring**: Detailed execution logs and failure notifications
- **Flexible scheduling**: Precise timing without GitHub's workflow limitations
- **Cost-effective**: Free tier covers most use cases
- **Reliable**: Dedicated cron infrastructure vs shared CI/CD runners

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
- Write unit and integration tests with Vitest and MSW
- Perform E2E and visual regression testing with Playwright
- Develop UI components in isolation using Storybook
- Follow conventional commit messages
- Use the established project structure for consistency

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test` and `npm run test:e2e`
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
