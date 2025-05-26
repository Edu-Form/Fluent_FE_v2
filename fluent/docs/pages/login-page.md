# Login Page Documentation

## Overview

The Login page serves as the entry point to the Fluent Learning Platform. It provides a simple authentication mechanism based on phone numbers, differentiating between student and teacher users automatically after login.

## Component Structure

The page consists of a single React component (`Page`) with the following structure:

- A card container with login UI elements
- An illustration image at the top
- A login title
- A phone number input field
- A login button that triggers authentication

## Authentication Flow

1. User enters their phone number in the input field
2. Upon clicking the "Log in" button, the application:
   - Makes an API request to `/api/user/{phoneNumber}`
   - Receives user data from the server
   - Determines if the user is a student or teacher based on the presence of a `level` property
   - Redirects to the appropriate dashboard with query parameters:
     - For students: `/student/home?user={name}&type=student&id={phoneNumber}`
     - For teachers: `/teacher/home?user={name}&type=teacher&id={phoneNumber}`

## State Management

The component uses React's `useState` hook to maintain a single piece of state:
- `username`: Stores the user's phone number input

## Navigation

The component uses Next.js's `useRouter` for programmatic navigation:
- Successful login: Redirects to either student or teacher dashboard
- Failed login: Redirects back to the home page

## API Integration

The page interacts with the following API endpoint:
- `GET /api/user/{phoneNumber}`: Fetches user data based on phone number
- Expected response: User object with properties that can identify user type

## User Type Differentiation

- **Students** have a `level` property in their user object
- **Teachers** do not have a `level` property

## UI Components

The page utilizes the following UI components:
- `Card`, `CardHeader`, `CardFooter`, `CardTitle`: For structured layout
- `Button`: For the login action
- `Image`: For displaying the login illustration

## Styling

- Uses Tailwind CSS for responsive and clean design
- Mobile-friendly with appropriate sizing and spacing
- Primary color scheme with brand colors (#171861)
- Focus states for input elements
- Hover effects for the login button

## Technical Implementation Notes

- Uses the "use client" directive for client-side rendering
- Employs Next.js Image component for optimized image loading
- Form submission handled through JavaScript rather than traditional form submission

## Accessibility Considerations

- Input field has a proper label
- Button has clear text indicating its purpose
- Visual feedback for interactive elements

## Example Code

```tsx
export default function Page() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  async function Login() {
    const url = `api/user/${username}`;
    const response = await fetch(url);
    if (response.ok) {
      const user = await response.json();
      if (user) {
        if ("level" in user) {
          // Student login
          const url = `/student/home?user=${user.name}&type=student&id=${user.phoneNumber}`;
          router.push(url);
        } else {
          // Teacher login
          const url = `/teacher/home?user=${user.name}&type=teacher&id=${user.phoneNumber}`;
          router.push(url);
        }
      }
    } else {
      // Failed login
      router.push("/");
    }
  }
}
```

## Potential Improvements

- Add form validation for phone number format
- Implement error handling for invalid phone numbers
- Add loading state during authentication
- Include remember me functionality
- Provide password-based authentication as an alternative 