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
- [🧪 Testing](#-testing)
- [🔧 Tech Stack](#-tech-stack)
- [📚 Documentation](#-documentation)
- [🔍 Troubleshooting](#-troubleshooting)
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

- **[Node.js](https://nodejs.org/)** v18.0.0 or higher (LTS v20+ recommended)
- **[npm](https://www.npmjs.com/)** v9.0.0 or higher (comes with Node.js)
- **Operating System**: macOS, Linux, or Windows with WSL2
- **Supabase Account** - For database and authentication ([Sign up](https://supabase.com/))
- **YouTube Data API Key** - For YouTube integration ([Get API Key](https://developers.google.com/youtube/v3/getting-started))
- **OpenRouter API Key** - For AI summarization ([Get API Key](https://openrouter.ai/))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/YTInsightsapp.git
   cd YTInsightsapp
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

## 🧪 Testing

Video Summary uses a comprehensive testing strategy with multiple testing tools to ensure code quality and reliability.

### Unit & Integration Tests (Vitest)

Run fast unit and integration tests with API mocking:

```bash
# Run all unit tests once
npm run test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage report
npm run test -- --coverage
```

**Testing Stack:**
- **Vitest** - Fast unit test runner with native ESM support
- **React Testing Library** - Component testing focused on user interactions
- **MSW (Mock Service Worker)** - API mocking for integration tests

### End-to-End Tests (Playwright)

Run comprehensive E2E tests that simulate real user workflows:

```bash
# Run all E2E tests in headless mode
npm run test:e2e

# Run E2E tests with interactive UI
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Debug a specific test
npx playwright test --debug tests/e2e/dashboard.spec.ts
```

**Playwright Features:**
- Cross-browser testing (Chromium, Firefox, WebKit)
- Visual regression testing with screenshots
- Network interception and mocking
- Parallel test execution

### Component Development (Storybook)

Develop and test UI components in isolation:

```bash
# Start Storybook development server
npm run storybook

# Build Storybook for production
npm run build-storybook
```

### Code Quality

```bash
# Run TypeScript type checking
npm run typecheck

# Lint code for errors
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

### Testing Best Practices

- Write tests alongside your code (co-located in `__tests__` directories)
- Use React Testing Library for component tests (test user behavior, not implementation)
- Use MSW to mock API calls in integration tests
- Use Playwright for critical user flows (auth, dashboard, summary generation)
- Run `npm run test:watch` during development for instant feedback
- Ensure all tests pass before committing (`npm run lint && npm run test`)

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

## 🏗️ CI/CD Architecture

Video Summary uses a modern, modular CI/CD pipeline with GitHub Actions for automated testing and deployment.

### Workflows

- **`tests.yml`** - Reusable test workflow (lint, typecheck, unit tests, E2E tests)
- **`ci.yml`** - Continuous integration for PRs and main branch
- **`deploy.yml`** - Manual production deployment with approval
- **`preview.yml`** - Automatic preview deployments for pull requests

### Key Features

- ✅ **Smart Testing Strategy**: Fast tests on PRs (~2-3 min), full E2E tests on main (~15-20 min)
- ✅ **Preview Deployments**: Automatic preview for every PR on Cloudflare Pages
- ✅ **Deployment Tags**: Auto-created tags (`deploy-*`) mark tested commits ready for production
- ✅ **Easy Rollback**: Deploy any previous deployment tag with one click
- ✅ **Environment Protection**: Production deployments require manual approval

### Deployment Flow

1. Create PR → Fast tests + preview deployment
2. Merge to main → Full tests + deployment tag created
3. Manual deployment → Select deployment tag → Approve → Deploy to production

For detailed documentation, see [`.github/workflows/README.md`](.github/workflows/README.md) or the [Quick Start Guide](.github/workflows/QUICKSTART.md).

### Logging & Monitoring

Video Summary uses **LogTape** for production-ready logging with:

- Structured logging with automatic PII redaction
- AWS X-Ray distributed tracing support
- Environment-aware configuration (development vs production)
- Type-safe logging functions with hierarchical categories

For detailed logging documentation, see [`docs/logging.md`](docs/logging.md).

## 🔍 Troubleshooting

### Common Issues and Solutions

#### Installation Issues

**Problem**: `npm install` fails with dependency errors

```bash
# Solution 1: Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Solution 2: Use specific Node.js version (via nvm)
nvm install 20
nvm use 20
npm install
```

**Problem**: TypeScript errors after installation

```bash
# Rebuild TypeScript declarations
npm run typecheck
```

#### Development Server Issues

**Problem**: Port 3000 already in use

```bash
# Solution: Kill process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- --port 3001
```

**Problem**: Hot reload not working

```bash
# Solution: Restart dev server and clear cache
rm -rf .astro node_modules/.vite
npm run dev
```

#### Database & Authentication Issues

**Problem**: Supabase connection errors

- ✅ Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- ✅ Check if Supabase project is active (not paused)
- ✅ Ensure database migrations are applied
- ✅ Verify Row Level Security (RLS) policies are enabled

**Problem**: Authentication not working

```bash
# Check Supabase Auth settings:
# 1. Go to Supabase Dashboard → Authentication → Settings
# 2. Verify "Enable Email Confirmations" matches your setup
# 3. Check Site URL and Redirect URLs are correct
```

#### API & Summary Generation Issues

**Problem**: YouTube API quota exceeded

- YouTube Data API has a daily quota limit (10,000 units by default)
- Each video fetch uses ~3 units
- **Solution**: Request quota increase from Google Cloud Console or wait for daily reset

**Problem**: OpenRouter API errors

```bash
# Verify API key is valid
curl -H "Authorization: Bearer YOUR_OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/models

# Check account credits at https://openrouter.ai/
```

**Problem**: Summary generation stuck in queue

```bash
# Check queue status
npm run check-bulk-status status

# Reset stuck processes
npm run check-bulk-status reset

# Manually process queue
npm run process-queue
```

**Problem**: Transcript extraction fails

- Some videos don't have transcripts available
- Private/age-restricted videos can't be accessed
- **Solution**: Check video settings on YouTube, try a different video

#### Build & Deployment Issues

**Problem**: Build fails with memory errors

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**Problem**: Environment variables not working in production

- ✅ Verify all required env vars are set in Cloudflare Pages dashboard
- ✅ Check variable names match exactly (case-sensitive)
- ✅ Redeploy after adding/changing environment variables

#### Testing Issues

**Problem**: E2E tests failing locally

```bash
# Install Playwright browsers
npx playwright install

# Run with debug mode
npx playwright test --debug

# Update snapshots if UI changed intentionally
npx playwright test --update-snapshots
```

**Problem**: Tests pass locally but fail in CI

- Check Node.js version matches between local and CI
- Verify all environment variables are set in GitHub Secrets
- Review CI logs for specific error messages

### Getting Help

If you encounter issues not covered here:

1. **Check logs**: Look for error messages in browser console and terminal
2. **Review documentation**: See [`docs/`](docs/) folder for detailed guides
3. **GitHub Issues**: Search existing issues or create a new one
4. **Supabase Logs**: Check Supabase Dashboard → Logs for database errors

### Performance Tips

- **Slow dashboard loading**: Enable database indexes (see `supabase/migrations/`)
- **High API costs**: Adjust `OPENROUTER_MODEL` to a cheaper model (e.g., `gpt-3.5-turbo`)
- **Slow builds**: Use `npm run build -- --parallel` for faster builds

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenRouter](https://openrouter.ai/) for providing unified AI API access
- [Supabase](https://supabase.com/) for the excellent backend-as-a-service platform
- [Shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Astro](https://astro.build/) for the modern web framework

---

**Video Summary** - Stay informed, save time, never miss important content.
