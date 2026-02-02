import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`
  }
  return price.toString()
}

export function formatCurrency(price: number, currency: string = 'SAR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

export function getDealBadgeColor(dealType: string): string {
  switch (dealType) {
    case 'hot_deal':
      return 'bg-red-500 text-white'
    case 'good_deal':
      return 'bg-orange-500 text-white'
    case 'fair_price':
      return 'bg-blue-500 text-white'
    case 'overpriced':
      return 'bg-gray-500 text-white'
    default:
      return 'bg-gray-200 text-gray-700'
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}
