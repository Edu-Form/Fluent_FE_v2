# SideBar Component

## Overview
The SideBar component displays a searchable list of students in the Fluent learning platform. It allows teachers to quickly find and select students to view their information.

## Features
- Student listing with count indicator
- Real-time search functionality
- Visual indication of currently selected student
- Loading state with animation
- Browser history manipulation for maintaining state

## Props

| Prop | Type | Description |
|------|------|-------------|
| `onStudentSelect` | `(student: string) => void` | Callback function triggered when a student is selected |

## Component Structure

The component is split into two parts:
1. `SidebarLayout` - Wrapper component with Suspense for better loading handling
2. `SidebarContent` - Main implementation with all the functionality

## Data Fetching

The component fetches student data from an API endpoint with the format:
```
/api/diary/${type}/${user}
```

Where:
- `type` is fetched from URL query parameters
- `user` is fetched from URL query parameters

## Usage Example

```tsx
import { SidebarLayout } from "@/components/SideBar";

export default function DiaryPage() {
  const handleStudentSelect = (student: string) => {
    // Handle student selection
    console.log(`Selected student: ${student}`);
  };

  return (
    <div className="flex h-screen">
      <SidebarLayout onStudentSelect={handleStudentSelect} />
      {/* Rest of the page content */}
    </div>
  );
}
```

## State Management

The component manages several internal states:
- `searchTerm` - Current search input text
- `data` - Array of student names fetched from the API
- `loading` - Boolean indicating if data is being fetched

## URL Integration

The component reads from and writes to URL query parameters:
- Reads `user`, `type`, and `student_name` from the URL
- Updates the `student_name` parameter when a student is selected

## UI Elements

The sidebar consists of:
1. Header with title and student count
2. Search input with icon
3. Scrollable list of student items
4. Empty state message when no results match the search
5. Loading animation during data fetching

## Styling

The component uses Tailwind CSS for styling with:
- Responsive layout with fixed width of 300px
- Custom hover and active states for list items
- Interactive elements for better user experience
- Proper spacing and typography hierarchy 