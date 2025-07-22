// src/lib/favicon.ts
export function getFaviconUrl(url: string, size: number = 32): string {
  try {
    const domain = new URL(url).hostname
    
    // Use Google's favicon service as primary (most reliable)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`
  } catch (error) {
    console.error('Error parsing URL for favicon:', error)
    // Return a default favicon or empty string
    return '/default-favicon.ico'
  }
}

// Function to extract domain from URL
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}