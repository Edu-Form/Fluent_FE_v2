# useIsMobile Hook

## Overview

The `useIsMobile` hook provides a responsive way to detect if the current viewport is in the mobile size range. This hook is useful for conditionally rendering different UI components based on the device screen size.

## Usage

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

function ResponsiveComponent() {
  const isMobile = useIsMobile();
  
  return (
    <div>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
    </div>
  );
}
```

## Implementation Details

The hook uses React's `useState` and `useEffect` hooks to:

1. Create and maintain a state variable `isMobile` that tracks whether the viewport is in mobile size
2. Set up a media query listener that updates the state when the viewport size changes
3. Clean up the listener when the component unmounts

## Technical Specifications

- **Mobile Breakpoint**: 768px (configurable via the `MOBILE_BREAKPOINT` constant)
- **Return Value**: `boolean` - `true` when viewport width < 768px, `false` otherwise
- **Initial Value**: `undefined` until the first measurement, then converted to a boolean

## Hydration Considerations

The hook is designed to prevent hydration mismatches in Next.js by:

1. Initially setting the state to `undefined`
2. Only setting the actual value after the component has mounted (in the `useEffect`)
3. Using double negation (`!!`) to ensure a boolean return value

## Example Use Cases

### Responsive Navigation

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

function Navigation() {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileMenu /> : <DesktopNavbar />;
}
```

### Conditional Feature Rendering

```tsx
function FeatureComponent() {
  const isMobile = useIsMobile();
  
  return (
    <div>
      <h1>Feature Title</h1>
      {!isMobile && <ComplexDataVisualization />}
      {isMobile && <SimplifiedMobileView />}
    </div>
  );
}
```

### Responsive Grid Layout

```tsx
function GridLayout() {
  const isMobile = useIsMobile();
  
  return (
    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4`}>
      {items.map(item => (
        <GridItem key={item.id} item={item} />
      ))}
    </div>
  );
}
```

## Browser Compatibility

The hook uses the standard `window.matchMedia` API, which is supported in all modern browsers.

## Performance Considerations

The hook uses event listeners efficiently by:
- Setting up only one listener per component instance
- Properly cleaning up listeners when components unmount
- Using the browser's native media query system rather than listening to resize events 