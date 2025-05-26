/**
 * Custom hook for detecting mobile screen size
 * 
 * This hook provides a responsive way to determine if the current viewport width
 * is considered mobile (less than 768px). It updates automatically when the viewport
 * is resized.
 * 
 * @returns {boolean} Returns true if the viewport is in mobile size range, false otherwise
 * @example
 * // In a component
 * import { useIsMobile } from "@/hooks/use-mobile";
 * 
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div>
 *       {isMobile ? (
 *         <MobileVersion />
 *       ) : (
 *         <DesktopVersion />
 *       )}
 *     </div>
 *   );
 * }
 */
import * as React from "react"

// Breakpoint in pixels below which we consider the screen to be mobile size
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initially undefined to prevent hydration mismatch
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Create a media query list to track viewport width changes
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Handler function to update state when viewport changes
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Add listener for viewport changes
    mql.addEventListener("change", onChange)
    
    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Cleanup function to remove event listener
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Double negation ensures we return a boolean (not undefined)
  return !!isMobile
}
