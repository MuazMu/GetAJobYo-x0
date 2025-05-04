// Performance monitoring utilities

/**
 * Measures and logs the time taken for a function to execute
 * @param name Name of the function being measured
 * @param fn Function to measure
 * @returns Result of the function
 */
export async function measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  console.time(`⏱️ ${name}`)
  try {
    return await fn()
  } finally {
    console.timeEnd(`⏱️ ${name}`)
  }
}

/**
 * Debounces a function to prevent it from being called too frequently
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * Throttles a function to limit how often it can be called
 * @param fn Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Memoizes a function to cache its results
 * @param fn Function to memoize
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>()

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>
    }

    const result = fn.apply(this, args)
    cache.set(key, result)
    return result
  }
}
