// Test setup - collect console logs during tests
export const consoleLogs: string[] = []

const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

console.log = (...args: any[]) => {
  consoleLogs.push(args.join(' '))
  originalLog.apply(console, args)
}

console.error = (...args: any[]) => {
  consoleLogs.push('[ERROR] ' + args.join(' '))
  originalError.apply(console, args)
}

console.warn = (...args: any[]) => {
  consoleLogs.push('[WARN] ' + args.join(' '))
  originalWarn.apply(console, args)
}

export function clearLogs() {
  consoleLogs.length = 0
}

export function getLogs() {
  return [...consoleLogs]
}
