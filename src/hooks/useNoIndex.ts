import { useEffect } from 'react'

/**
 * Hook to prevent search engines from indexing a page
 * Adds noindex, nofollow meta tags to the page head
 */
export const useNoIndex = () => {
  useEffect(() => {
    // Check if meta robots tag already exists
    let metaRobots = document.querySelector('meta[name="robots"]')
    
    if (!metaRobots) {
      // Create new meta robots tag
      metaRobots = document.createElement('meta')
      metaRobots.setAttribute('name', 'robots')
      document.head.appendChild(metaRobots)
    }
    
    // Set to noindex, nofollow
    metaRobots.setAttribute('content', 'noindex, nofollow')
    
    // Cleanup: restore original robots tag on unmount (optional)
    return () => {
      const originalRobots = document.querySelector('meta[name="robots"]')
      if (originalRobots) {
        // Restore to default or remove
        originalRobots.setAttribute('content', 'index, follow')
      }
    }
  }, [])
}

