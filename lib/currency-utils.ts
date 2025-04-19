// Currency conversion rates (as of a recent date)
// These rates are relative to USD (1 USD = X units of currency)
export const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 149.82,
  CNY: 7.24,
  INR: 83.12,
  BRL: 5.05,
  ZAR: 18.65,
  MXN: 16.73,
  SGD: 1.34,
  CHF: 0.88,
  SEK: 10.42,
  NZD: 1.64,
  TRY: 32.15,
  ETB: 56.5,
  NGN: 1550.0,
  EGP: 47.85,
  KES: 129.5,
  GHS: 15.2,
}

// Currency symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  BRL: "R$",
  ZAR: "R",
  MXN: "Mex$",
  SGD: "S$",
  CHF: "CHF",
  SEK: "kr",
  NZD: "NZ$",
  TRY: "₺",
  ETB: "Br",
  NGN: "₦",
  EGP: "E£",
  KES: "KSh",
  GHS: "GH₵",
}

// Currency names
export const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
  BRL: "Brazilian Real",
  ZAR: "South African Rand",
  MXN: "Mexican Peso",
  SGD: "Singapore Dollar",
  CHF: "Swiss Franc",
  SEK: "Swedish Krona",
  NZD: "New Zealand Dollar",
  TRY: "Turkish Lira",
  ETB: "Ethiopian Birr",
  NGN: "Nigerian Naira",
  EGP: "Egyptian Pound",
  KES: "Kenyan Shilling",
  GHS: "Ghanaian Cedi",
}

// Convert amount from one currency to another
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (!amount || isNaN(amount)) return 0
  if (fromCurrency === toCurrency) return amount

  const fromRate = CURRENCY_RATES[fromCurrency] || 1
  const toRate = CURRENCY_RATES[toCurrency] || 1

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate
  const amountInTargetCurrency = amountInUSD * toRate

  return Number(amountInTargetCurrency.toFixed(2))
}

// Format currency with symbol
export function formatCurrency(amount: number, currency: string): string {
  if (!amount || isNaN(amount)) return ""

  const symbol = CURRENCY_SYMBOLS[currency] || "$"

  // Format based on currency conventions
  if (currency === "JPY" || currency === "CNY") {
    // No decimal places for Yen and Yuan
    return `${symbol}${Math.round(amount).toLocaleString()}`
  }

  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// Rate period conversion factors
const RATE_PERIOD_FACTORS: Record<string, Record<string, number>> = {
  hourly: {
    hourly: 1,
    daily: 8, // Assuming 8-hour workday
    weekly: 40, // Assuming 40-hour workweek
    monthly: 173.33, // Assuming 4.33 weeks per month
    yearly: 2080, // Assuming 2080 work hours per year (40 hours × 52 weeks)
  },
  daily: {
    hourly: 1 / 8,
    daily: 1,
    weekly: 5, // Assuming 5-day workweek
    monthly: 21.67, // Assuming 4.33 weeks per month
    yearly: 260, // Assuming 260 workdays per year (5 days × 52 weeks)
  },
  weekly: {
    hourly: 1 / 40,
    daily: 1 / 5,
    weekly: 1,
    monthly: 4.33, // Assuming 4.33 weeks per month
    yearly: 52, // 52 weeks per year
  },
  monthly: {
    hourly: 1 / 173.33,
    daily: 1 / 21.67,
    weekly: 1 / 4.33,
    monthly: 1,
    yearly: 12, // 12 months per year
  },
  yearly: {
    hourly: 1 / 2080,
    daily: 1 / 260,
    weekly: 1 / 52,
    monthly: 1 / 12,
    yearly: 1,
  },
}

// Convert salary from one rate period to another
export function convertRatePeriod(amount: number, fromPeriod: string, toPeriod: string): number {
  if (!amount || isNaN(amount)) return 0
  if (fromPeriod === toPeriod) return amount

  const factor = RATE_PERIOD_FACTORS[fromPeriod]?.[toPeriod] || 1
  return Number((amount * factor).toFixed(2))
}

// Parse salary range string to min and max values
export function parseSalaryRange(salaryRange: string): { min: number; max: number } {
  // Handle various formats: "50,000 - 70,000", "$50k-$70k", etc.
  const cleanedRange = salaryRange.replace(/[$,k]/g, (match) => {
    return match === "k" ? "000" : ""
  })

  const parts = cleanedRange.split(/\s*-\s*/)

  if (parts.length === 2) {
    const min = Number.parseFloat(parts[0])
    const max = Number.parseFloat(parts[1])
    return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? 0 : max }
  }

  // If no range found, try to parse as a single number
  const singleValue = Number.parseFloat(cleanedRange)
  return { min: isNaN(singleValue) ? 0 : singleValue, max: isNaN(singleValue) ? 0 : singleValue }
}

// Format salary range with currency and period
export function formatSalaryRange(min: number, max: number, currency: string, period: string): string {
  if (min === 0 && max === 0) return "Salary not specified"

  const formattedMin = formatCurrency(min, currency)

  if (min === max) {
    return `${formattedMin}${period !== "yearly" ? ` per ${period.slice(0, -2)}` : ""}`
  }

  const formattedMax = formatCurrency(max, currency)
  return `${formattedMin} - ${formattedMax}${period !== "yearly" ? ` per ${period.slice(0, -2)}` : ""}`
}

// Calculate match percentage based on salary and currency preferences
export function calculateSalaryMatch(
  jobSalaryMin: number,
  jobSalaryMax: number,
  jobCurrency: string,
  jobPeriod: string,
  userSalary: number,
  userCurrency: string,
): number {
  if (!userSalary || userSalary === 0) return 100 // If user has no preference, it's a match

  // Convert job salary to user's currency and yearly period for comparison
  const jobSalaryMinConverted = convertCurrency(
    convertRatePeriod(jobSalaryMin, jobPeriod, "yearly"),
    jobCurrency,
    userCurrency,
  )

  const jobSalaryMaxConverted = convertCurrency(
    convertRatePeriod(jobSalaryMax, jobPeriod, "yearly"),
    jobCurrency,
    userCurrency,
  )

  // User's yearly salary expectation
  const userYearlySalary = userSalary

  // If job salary is a range
  if (jobSalaryMin !== jobSalaryMax) {
    // If user's expectation is within the range, it's a perfect match
    if (userYearlySalary >= jobSalaryMinConverted && userYearlySalary <= jobSalaryMaxConverted) {
      return 100
    }

    // If user's expectation is below the minimum
    if (userYearlySalary < jobSalaryMinConverted) {
      const difference = jobSalaryMinConverted - userYearlySalary
      const percentDifference = (difference / userYearlySalary) * 100

      // If the job pays more than expected, it's still a good match
      return Math.max(0, 100 - Math.min(percentDifference, 50))
    }

    // If user's expectation is above the maximum
    if (userYearlySalary > jobSalaryMaxConverted) {
      const difference = userYearlySalary - jobSalaryMaxConverted
      const percentDifference = (difference / jobSalaryMaxConverted) * 100

      return Math.max(0, 100 - Math.min(percentDifference, 100))
    }
  } else {
    // If job salary is a single value
    const difference = Math.abs(userYearlySalary - jobSalaryMinConverted)
    const percentDifference = (difference / Math.max(userYearlySalary, jobSalaryMinConverted)) * 100

    return Math.max(0, 100 - Math.min(percentDifference, 100))
  }

  return 50 // Default match percentage
}
