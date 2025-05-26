# Fluent Learning Platform

A modern, interactive educational platform built with Next.js, React, and TypeScript, designed to enhance the learning experience for both students and teachers.

## Project Overview

Fluent is an educational platform that provides:
- Separate interfaces for teachers and students
- Interactive classroom features
- Assignment management
- Curriculum tracking
- Real-time notifications
- Calendar scheduling

## Tech Stack

- **Frontend Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS with DaisyUI components
- **State Management**: React Hooks
- **Text Editing**: TipTap
- **Calendar**: Toast UI Calendar
- **Icons**: Lucide React
- **Animation**: Framer Motion, Lottie
- **Date Handling**: date-fns
- **HTTP Client**: Axios
- **Database**: MongoDB

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- Yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fluent
```

2. Install dependencies:
```bash

npm install

or 

npm install --global yarn

verify it : yarn --version

yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
# Add your environment variables here
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
fluent/
├── src/                  # Source code
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── student/      # Student-facing pages
│   │   ├── teacher/      # Teacher-facing pages
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
├── components/           # Reusable React components
│   ├── ui/               # UI components
│   ├── VariousRoom/      # Room-related components
│   ├── ToastUI/          # Calendar components
│   ├── Quizlet/          # Quiz components
│   └── Diary/            # Diary components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── public/               # Static assets
└── ...config files       # Various configuration files
```

## Key Features

### For Teachers
- Classroom management
- Assignment creation and grading
- Student progress tracking
- Scheduling and calendar management
- Announcements and notifications

### For Students
- Interactive learning materials
- Assignment submission
- Progress tracking
- Communication with teachers
- Calendar and scheduling

## Documentation

Detailed documentation for components and functions can be found in the `/docs` directory.

## License

All rights reserved@Fluent Tech
