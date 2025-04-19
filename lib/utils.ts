import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { formatSalaryRange, parseSalaryRange } from "./currency-utils"

export { formatSalaryRange, parseSalaryRange }
