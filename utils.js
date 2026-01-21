// Enhanced API Client & Utilities - Complete Trading Dashboard Utils
export class APIClient {
  constructor(baseURL = "/api") {
    this.baseURL = baseURL
    this.cache = new Map()
    this.cacheTimeout = 30000 // 30 seconds
    this.retryCount = 3
    this.retryDelay = 1000
  }

  async get(endpoint, useCache = false) {
    const cacheKey = `${this.baseURL}${endpoint}`

    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data
      }
    }

    // Retry logic
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`${this.baseURL}${endpoint}`, {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Cache successful responses
        if (useCache) {
          this.cache.set(cacheKey, { data, timestamp: Date.now() })
        }

        return data
      } catch (error) {
        console.error(`API Error (${endpoint}) - Attempt ${attempt}:`, error)

        if (attempt === this.retryCount) {
          throw error
        }

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt))
      }
    }
  }

  async getSymbols() {
    return this.get("/symbols", true)
  }

  async getFeatures() {
    return this.get("/features", true)
  }

  async getChartData(symbol, timeframe, pane1, pane2) {
    const params = new URLSearchParams({
      symbol: symbol || "NIFTY",
      timeframe: timeframe || "1D",
      pane1: pane1 || "CurrentPrice",
      pane2: pane2 || "AllExchangesVolume",
    })
    return this.get(`/chart-data?${params}`)
  }

  async getHealth() {
    return this.get("/health")
  }

  clearCache() {
    this.cache.clear()
  }
}

// Enhanced Data Processing Utilities
export class DataProcessor {
  static formatPrice(price) {
    if (!price || isNaN(price)) return "0.00"
    const num = Number.parseFloat(price)

    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`
    if (num >= 1000) return `₹${(num / 1000).toFixed(2)}K`

    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  static formatChange(change, changePercent) {
    if (!change && change !== 0) return "+0.00 (0.00%)"

    const sign = change >= 0 ? "+" : ""
    const formattedChange = Math.abs(change).toFixed(2)
    const formattedPercent = Math.abs(changePercent || 0).toFixed(2)

    return `${sign}${formattedChange} (${sign}${formattedPercent}%)`
  }

  static formatVolume(volume) {
    if (!volume || isNaN(volume)) return "0"
    const num = Number.parseFloat(volume)

    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`

    return num.toFixed(0)
  }

  static formatTime(timestamp) {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch {
      return "00:00:00"
    }
  }

  static formatDate(timestamp) {
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Invalid Date"
    }
  }

  // Technical Analysis Calculations
  static calculateSMA(data, period) {
    if (!Array.isArray(data) || data.length < period) return []

    const sma = []
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      sma.push(sum / period)
    }
    return sma
  }

  static calculateEMA(data, period) {
    if (!Array.isArray(data) || data.length < period) return []

    const ema = []
    const multiplier = 2 / (period + 1)

    // First EMA is SMA
    let sum = 0
    for (let i = 0; i < period; i++) {
      sum += data[i]
    }
    ema.push(sum / period)

    // Calculate EMA for remaining data points
    for (let i = period; i < data.length; i++) {
      const currentEMA = data[i] * multiplier + ema[ema.length - 1] * (1 - multiplier)
      ema.push(currentEMA)
    }

    return ema
  }

  static calculateRSI(prices, period = 14) {
    if (!Array.isArray(prices) || prices.length < period + 1) return []

    const gains = []
    const losses = []

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      gains.push(change > 0 ? change : 0)
      losses.push(change < 0 ? Math.abs(change) : 0)
    }

    const rsi = []
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period

      const rs = avgGain / avgLoss
      const rsiValue = 100 - 100 / (1 + rs)
      rsi.push(rsiValue)
    }

    return rsi
  }
}

// Enhanced Storage Utility
export class Storage {
  static set(key, value, expiry = null) {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        expiry: expiry ? Date.now() + expiry : null,
      }
      localStorage.setItem(key, JSON.stringify(item))
    } catch (error) {
      console.error("Storage set error:", error)
    }
  }

  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      if (!item) return defaultValue

      const parsed = JSON.parse(item)

      // Check expiry
      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(key)
        return defaultValue
      }

      return parsed.value
    } catch (error) {
      console.error("Storage get error:", error)
      return defaultValue
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error("Storage remove error:", error)
    }
  }

  static clear() {
    try {
      localStorage.clear()
    } catch (error) {
      console.error("Storage clear error:", error)
    }
  }
}

// Utility Functions
export const debounce = (func, wait, immediate = false) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const clsx = (...classes) => {
  return classes.filter(Boolean).join(" ")
}

export const formatCurrency = (amount, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `₹${amount.toFixed(2)}`
  }
}

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

export const isValidNumber = (value) => {
  return typeof value === "number" && !isNaN(value) && isFinite(value)
}

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max)
}

// Export default API client instance
export default APIClient