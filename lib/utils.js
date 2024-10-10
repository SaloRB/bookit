import { DateTime } from 'luxon'

// Format a date string to a human-readable format
export function formatDate(dateString) {
  const date = new Date(dateString)

  // Get month
  const options = { month: 'long' }
  const month = date.toLocaleString('en-US', options, { timeZone: 'UTC' })

  // Get day
  const day = date.getUTCDate()

  // Format time in UTC 12-hour
  const timeOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: 'UTC',
  }

  const time = date.toLocaleString('en-US', timeOptions)

  // Final formatted string
  return `${month} ${day} at ${time}`
}

// Convert a date string to a Luxon DateTime object in UTC
export function toUTCDateTime(dateString) {
  return DateTime.fromISO(dateString, { zone: 'utc' }).toUTC()
}

// Check for overlapping date ranges
export function dateRangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB
}
