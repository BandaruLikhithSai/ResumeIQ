export function scoreColor(score) {
  if (score >= 85) return 'green'
  if (score >= 70) return 'blue'
  if (score >= 50) return 'yellow'
  if (score >= 30) return 'orange'
  return 'red'
}

export function scoreLabel(score) {
  if (score >= 85) return 'Excellent Match'
  if (score >= 70) return 'Strong Match'
  if (score >= 50) return 'Moderate Match'
  if (score >= 30) return 'Weak Match'
  return 'Poor Match'
}

export function priorityColor(priority) {
  if (priority === 'high') return 'red'
  if (priority === 'medium') return 'yellow'
  return 'gray'
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function capitalize(str) {
  if (!str) return ''
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function statusConfig(status) {
  const map = {
    fully_matched:     { label: 'Matched',      color: 'green',  symbol: '✓' },
    partially_matched: { label: 'Partial',       color: 'blue',   symbol: '◐' },
    transferable:      { label: 'Transferable',  color: 'purple', symbol: '↗' },
    missing:           { label: 'Missing',       color: 'red',    symbol: '✕' },
  }
  return map[status] || { label: status, color: 'gray', symbol: '?' }
}
