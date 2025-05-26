# Fluent Project Structure and Conventions

## Project Architecture

The Fluent learning platform uses a modern Next.js architecture with the App Router pattern. This document outlines the project structure, conventions, and key patterns used throughout the codebase.

## Directory Structure

```
fluent/
├── src/                  # Main source code
│   ├── app/              # Next.js App Router structure
│   │   ├── api/          # API routes and handlers
│   │   ├── student/      # Student dashboard and features
│   │   ├── teacher/      # Teacher dashboard and features
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout component
│   │   └── page.tsx      # Landing page component
├── components/           # Reusable React components
│   ├── ui/               # Low-level UI components
│   ├── VariousRoom/      # Components for room management
│   ├── ToastUI/          # Calendar and scheduling components
│   ├── Quizlet/          # Quiz-related components
│   └── Diary/            # Student diary components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries and client implementations
├── types/                # TypeScript type definitions
├── utils/                # Helper functions and utilities
├── public/               # Static assets
└── [config files]        # Project configuration files
```

## Key Architecture Patterns

### 1. App Router Structure

The application uses Next.js App Router for routing, with:
- Page components in corresponding directories
- Layout components for shared UI elements
- Server components where possible for improved performance
- Client components (with "use client" directive) where interactivity is needed

### 2. Component Organization

Components follow these patterns:
- **UI Components**: Low-level, reusable interface elements
- **Feature Components**: Higher-level components tied to specific features
- **Layout Components**: Components for page structure and arrangement
- **Page Components**: Top-level components that represent routes

### 3. Data Fetching

The application uses several data fetching approaches:
- Server-side data fetching in server components
- Client-side fetching using the Fetch API
- URL-based parameters for dynamic data loading
- Error handling and loading states throughout

### 4. State Management

State is managed primarily through:
- React's built-in hooks (`useState`, `useReducer`)
- Custom hooks for shared logic
- URL state for shareable/bookmarkable states
- Server-side state where appropriate

## Code Conventions

### 1. Component Structure

```tsx
// 1. Imports
import { useState } from 'react';
import { SomeComponent } from '@/components/SomeComponent';

// 2. Types/Interfaces
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// 3. Component Definition
export function MyComponent({ prop1, prop2 = 0 }: ComponentProps) {
  // 4. Hooks and State
  const [state, setState] = useState(false);
  
  // 5. Handlers and Effects
  const handleClick = () => {
    setState(!state);
  };
  
  // 6. Conditional Rendering (if applicable)
  if (!prop1) {
    return <div>No prop1 provided</div>;
  }
  
  // 7. Main Render
  return (
    <div>
      <h1>{prop1}</h1>
      <button onClick={handleClick}>Toggle</button>
      {state && <SomeComponent />}
    </div>
  );
}
```

### 2. Naming Conventions

- **Components**: PascalCase (e.g., `StudentCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useStudentData.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types/Interfaces**: PascalCase (e.g., `StudentData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_STUDENTS`)

### 3. CSS Styling

The project uses Tailwind CSS with these conventions:
- Use Tailwind utility classes directly on elements
- Use class composition for common patterns
- Follow mobile-first responsive design
- Use semantic class naming when extending Tailwind

### 4. Type Safety

- Use TypeScript interfaces for component props
- Prefer explicit types over `any`
- Use proper type narrowing where needed
- Document complex types with JSDoc comments

## Important Patterns and Examples

### 1. Data Fetching Pattern

```tsx
// In a server component
export async function StudentList() {
  const students = await fetchStudents();
  return <StudentDisplay students={students} />;
}

// In a client component
"use client";
export function StudentSearch() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/students');
        const data = await response.json();
        setStudents(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Component render with loading state handling
}
```

### 2. Form Handling Pattern

```tsx
"use client";
import { useState } from 'react';

export function StudentForm() {
  const [form, setForm] = useState({
    name: '',
    grade: '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Form submission logic
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### 3. Layout Pattern

```tsx
// In app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

## API Endpoints

The application uses several API endpoints following this pattern:

- `/api/[resource]/[action]` - REST-like structured API
- `/api/diary/${type}/${user}` - For diary-related operations
- `/api/student/[id]` - For student-specific operations
- `/api/teacher/[id]` - For teacher-specific operations

## Documentation Practices

All code should be documented with:

1. JSDoc comments for components and functions
2. Inline comments for complex logic
3. Type definitions for improved code understanding
4. README files for each major directory explaining its purpose 