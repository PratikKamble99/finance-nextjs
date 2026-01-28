/**
 * Financial calculation utilities for investment analysis
 */

export interface CashFlow {
  date: Date
  amount: number // Negative for outflows (investments), positive for inflows (returns)
}

/**
 * Calculate XIRR (Extended Internal Rate of Return) using Newton-Raphson method
 * @param cashFlows Array of cash flows with dates and amounts
 * @param guess Initial guess for IRR (default: 0.1 or 10%)
 * @param maxIterations Maximum number of iterations (default: 100)
 * @param tolerance Tolerance for convergence (default: 1e-6)
 * @returns XIRR as a decimal (multiply by 100 for percentage)
 */
export function calculateXIRR(
  cashFlows: CashFlow[],
  guess: number = 0.1,
  maxIterations: number = 100,
  tolerance: number = 1e-6
): number {
  if (cashFlows.length < 2) {
    throw new Error('At least 2 cash flows are required for XIRR calculation')
  }

  // Sort cash flows by date
  const sortedCashFlows = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime())
  const firstDate = sortedCashFlows[0].date

  let rate = guess
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0
    let dnpv = 0
    
    for (const cf of sortedCashFlows) {
      const daysDiff = (cf.date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      const yearsDiff = daysDiff / 365.25
      
      const factor = Math.pow(1 + rate, yearsDiff)
      npv += cf.amount / factor
      dnpv -= (cf.amount * yearsDiff) / (factor * (1 + rate))
    }
    
    if (Math.abs(npv) < tolerance) {
      return rate
    }
    
    if (Math.abs(dnpv) < tolerance) {
      throw new Error('XIRR calculation failed: derivative too small')
    }
    
    rate = rate - npv / dnpv
  }
  
  throw new Error('XIRR calculation failed to converge')
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 * @param beginningValue Initial investment value
 * @param endingValue Final investment value
 * @param years Number of years
 * @returns CAGR as a decimal (multiply by 100 for percentage)
 */
export function calculateCAGR(beginningValue: number, endingValue: number, years: number): number {
  if (beginningValue <= 0 || endingValue <= 0 || years <= 0) {
    throw new Error('All values must be positive for CAGR calculation')
  }
  
  return Math.pow(endingValue / beginningValue, 1 / years) - 1
}

/**
 * Calculate simple annualized return
 * @param beginningValue Initial investment value
 * @param endingValue Final investment value
 * @param years Number of years
 * @returns Annualized return as a decimal
 */
export function calculateAnnualizedReturn(beginningValue: number, endingValue: number, years: number): number {
  if (years <= 0) {
    throw new Error('Years must be positive')
  }
  
  return ((endingValue - beginningValue) / beginningValue) / years
}

/**
 * Calculate portfolio beta (systematic risk)
 * @param portfolioReturns Array of portfolio returns
 * @param marketReturns Array of market returns (same length as portfolio)
 * @returns Beta coefficient
 */
export function calculateBeta(portfolioReturns: number[], marketReturns: number[]): number {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length < 2) {
    throw new Error('Portfolio and market returns must have the same length and at least 2 data points')
  }
  
  const n = portfolioReturns.length
  const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / n
  const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / n
  
  let covariance = 0
  let marketVariance = 0
  
  for (let i = 0; i < n; i++) {
    const portfolioDiff = portfolioReturns[i] - portfolioMean
    const marketDiff = marketReturns[i] - marketMean
    
    covariance += portfolioDiff * marketDiff
    marketVariance += marketDiff * marketDiff
  }
  
  covariance /= (n - 1)
  marketVariance /= (n - 1)
  
  if (marketVariance === 0) {
    throw new Error('Market variance is zero, cannot calculate beta')
  }
  
  return covariance / marketVariance
}

/**
 * Calculate Sharpe ratio
 * @param returns Array of investment returns
 * @param riskFreeRate Risk-free rate (e.g., treasury bill rate)
 * @returns Sharpe ratio
 */
export function calculateSharpeRatio(returns: number[], riskFreeRate: number): number {
  if (returns.length < 2) {
    throw new Error('At least 2 returns are required for Sharpe ratio calculation')
  }
  
  const n = returns.length
  const mean = returns.reduce((sum, r) => sum + r, 0) / n
  const excessReturn = mean - riskFreeRate
  
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1)
  const standardDeviation = Math.sqrt(variance)
  
  if (standardDeviation === 0) {
    throw new Error('Standard deviation is zero, cannot calculate Sharpe ratio')
  }
  
  return excessReturn / standardDeviation
}

/**
 * Calculate maximum drawdown
 * @param values Array of portfolio values over time
 * @returns Object with maxDrawdown percentage and period information
 */
export function calculateMaxDrawdown(values: number[]): {
  maxDrawdown: number
  peakIndex: number
  troughIndex: number
  recoveryIndex: number | null
} {
  if (values.length < 2) {
    throw new Error('At least 2 values are required for drawdown calculation')
  }
  
  let maxDrawdown = 0
  let peakIndex = 0
  let troughIndex = 0
  let recoveryIndex: number | null = null
  let peak = values[0]
  let peakIdx = 0
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i]
      peakIdx = i
    }
    
    const drawdown = (peak - values[i]) / peak
    
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
      peakIndex = peakIdx
      troughIndex = i
      recoveryIndex = null
      
      // Look for recovery
      for (let j = i + 1; j < values.length; j++) {
        if (values[j] >= peak) {
          recoveryIndex = j
          break
        }
      }
    }
  }
  
  return {
    maxDrawdown,
    peakIndex,
    troughIndex,
    recoveryIndex
  }
}

/**
 * Calculate Value at Risk (VaR) using historical simulation
 * @param returns Array of historical returns
 * @param confidenceLevel Confidence level (e.g., 0.95 for 95%)
 * @param portfolioValue Current portfolio value
 * @returns VaR amount (positive number representing potential loss)
 */
export function calculateVaR(returns: number[], confidenceLevel: number, portfolioValue: number): number {
  if (returns.length === 0) {
    throw new Error('Returns array cannot be empty')
  }
  
  if (confidenceLevel <= 0 || confidenceLevel >= 1) {
    throw new Error('Confidence level must be between 0 and 1')
  }
  
  const sortedReturns = [...returns].sort((a, b) => a - b)
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length)
  const varReturn = sortedReturns[index]
  
  return Math.abs(varReturn * portfolioValue)
}