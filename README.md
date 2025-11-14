# YTInsights

[![Project Status: In Progress](https://img.shields.io/badge/status-in%20progress-yellow.svg)](https://github.com/your-username/YTInsights)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

YTInsights is a web application designed for users who subscribe to multiple valuable YouTube channels but lack the time to regularly watch all published content. The app solves this problem by automatically generating concise, structured summaries of new videos, enabling users to efficiently absorb key information in a fraction of the time and eliminate the "fear of missing out" (FOMO).

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
  - [Key Features](#key-features)
  - [Future Development](#future-development)
- [Project Status](#project-status)
- [License](#license)

## Project Description

In an age of information overload, staying up-to-date with educational, financial, or news-related YouTube channels is a challenge. YTInsights addresses this by providing users with AI-powered summaries of the latest videos from their favorite creators. This allows users to stay informed and capture the core value of long-form video content without spending hours watching.

## Tech Stack

| Category              | Technology                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Frameworks**        | [Astro](https://astro.build/), [React](https://react.dev/)                                                   |
| **Language**          | [TypeScript](https://www.typescriptlang.org/)                                                               |
| **Styling**           | [Tailwind CSS](https://tailwindcss.com/), [Shadcn/ui](https://ui.shadcn.com/)                                |
| **Backend**           | Serverless Functions ([Vercel](https://vercel.com/))                                                         |
| **Database & Auth**   | [Supabase](https://supabase.com/) (PostgreSQL with RLS)                                                       |
| **AI Services**       | [OpenRouter](https://openrouter.ai/)                                                                        |
| **Tooling**           | [Vite](https://vitejs.dev/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/)                  |
| **Testing**           | [Vitest](https://vitest.dev/) (Unit), [Playwright](https://playwright.dev/) (E2E)                               |
| **Automation**        | [GitHub Actions](https://github.com/features/actions) (CI/CD)                                               |

## Getting Started Locally

Follow these instructions to set up the project on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/YTInsights.git
    cd YTInsights
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary environment variables. You can copy the example below:

    ```env
    # .env.example

    # Supabase credentials (found in your Supabase project settings)
    PUBLIC_SUPABASE_URL="your_supabase_project_url"
    PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

    # OpenRouter API Key
    OPENROUTER_API_KEY="your_openrouter_api_key"
    ```

### Running the Application

Start the development server:

```sh
npm run dev
```

The application will be available at `http://localhost:4321`.

## Available Scripts

| Script       | Description                                            |
| ------------ | ------------------------------------------------------ |
| `npm run dev`    | Starts the development server with hot-reloading.      |
| `npm run build`  | Builds the application for production.                 |
| `npm run preview`| Serves the production build locally for preview.       |
| `npm run lint`   | Lints the codebase for errors and style issues.        |
| `npm run lint:fix`| Automatically fixes linting issues.                    |
| `npm run format` | Formats the code using Prettier.                       |
| `npm run astro`  | Provides access to the Astro CLI for various commands. |

## Project Scope

This project is currently focused on delivering a core set of features for the Minimum Viable Product (MVP).

### Key Features

-   **Authentication:** Secure user registration and login via email and password, including a password reset mechanism.
-   **Channel Management:** Users can add up to 10 YouTube channels by URL and manage them in their profile.
-   **AI Summaries:**
    -   Automatic daily generation of a summary for the latest video from each subscribed channel.
    -   Manual trigger to generate a summary on-demand.
    -   Generates both a quick TL;DR (~100 tokens) and a detailed, structured summary (~500 tokens).
-   **Dashboard:** A clean, responsive interface to view all summaries, sorted chronologically.
-   **Detailed View:** A dedicated page for each summary with full content, a link to the original video, and rating options.
-   **Error Handling:** Clear notifications for summary generation issues (e.g., private videos, no captions, videos over 45 minutes).

### Future Development

The following features are planned for future releases and are not included in the current MVP scope:

-   Summarizing any YouTube video URL without requiring a channel subscription.
-   Advanced summary categorization and filtering.
-   Social logins (Google, GitHub, etc.).
-   Support for videos longer than 45 minutes.
-   Translation of summaries into other languages.
-   Paid subscription plans for increased limits and premium features.

## Project Status

This project is currently **in progress**. The focus is on developing the MVP features outlined above. Contributions, issues, and feature requests are welcome.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.
