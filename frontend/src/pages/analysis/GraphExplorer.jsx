import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { GitBranch, Info, Search, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react'
import { graphApi, analysisApi } from '../../api'
import { useTheme } from '../../context/ThemeContext'

export default function GraphExplorer() {
  const { analysisId } = useParams()
  const { isDark } = useTheme()
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNode, setSelectedNode] = useState(null)
  const [stats, setStats] = useState(null)
  const canvasRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const nodePositions = useRef({})
  const dragging = useRef(null)
  const isDraggingCanvas = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, graphRes] = await Promise.all([
          graphApi.stats(),
          analysisId ? analysisApi.graph(analysisId) : graphApi.full(),
        ])
        setStats(statsRes.data)
        setGraphData(graphRes.data)
      } catch (e) {
        try {
          const res = await graphApi.full()
          setGraphData(res.data)
        } catch {}
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [analysisId])

  // Layout: force-directed positions
  useEffect(() => {
    if (!graphData) return
    const nodes = graphData.nodes || []
    nodes.forEach(n => {
      if (!nodePositions.current[n.id]) {
        nodePositions.current[n.id] = {
          x: 100 + Math.random() * 700,
          y: 100 + Math.random() * 500,
          vx: 0, vy: 0,
        }
      }
    })
    runForceLayout(graphData, nodePositions.current)
  }, [graphData])

  function runForceLayout(gd, positions) {
    const nodes = gd.nodes || []
    const edges = gd.edges || []
    const iterations = 80

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = positions[nodes[i].id]
          const b = positions[nodes[j].id]
          if (!a || !b) continue
          const dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx*dx + dy*dy) || 1
          const force = 2000 / (dist * dist)
          const fx = (dx / dist) * force, fy = (dy / dist) * force
          a.vx -= fx; a.vy -= fy
          b.vx += fx; b.vy += fy
        }
      }
      for (const e of edges) {
        const a = positions[e.source], b = positions[e.target]
        if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx*dx + dy*dy) || 1
        const force = (dist - 120) * 0.03
        a.vx += (dx / dist) * force; a.vy += (dy / dist) * force
        b.vx -= (dx / dist) * force; b.vy -= (dy / dist) * force
      }
      for (const n of nodes) {
        const p = positions[n.id]
        if (!p) continue
        p.vx *= 0.85; p.vy *= 0.85
        p.x = Math.max(60, Math.min(840, p.x + p.vx))
        p.y = Math.max(60, Math.min(540, p.y + p.vy))
      }
    }
  }

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !graphData) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)

    // Canvas background
    ctx.fillStyle = isDark ? '#1e2535' : '#ffffff'
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    const positions = nodePositions.current
    const nodes = graphData.nodes || []
    const edges = graphData.edges || []
    const search = searchTerm.toLowerCase()

    // Relationship colors — slightly desaturated in dark mode for subtlety
    const REL_COLORS = isDark
      ? {
          prerequisite_of: '#d97706', // amber-600
          related_to:      '#6366f1', // indigo-500
          supports:        '#059669', // emerald-600
          transferable_to: '#7c3aed', // violet-600
          part_of:         '#2563eb', // blue-600
        }
      : {
          prerequisite_of: '#f59e0b',
          related_to:      '#6366f1',
          supports:        '#10b981',
          transferable_to: '#8b5cf6',
          part_of:         '#3b82f6',
        }

    // Draw edges
    for (const e of edges) {
      const a = positions[e.source], b = positions[e.target]
      if (!a || !b) continue
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = REL_COLORS[e.relation] || (isDark ? '#3d4f6e' : '#d1d5db')
      ctx.lineWidth = 1.2
      ctx.globalAlpha = isDark ? 0.4 : 0.5
      ctx.stroke()
      ctx.globalAlpha = 1

      // Arrow
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      const ax = b.x - Math.cos(angle) * 18
      const ay = b.y - Math.sin(angle) * 18
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(ax - 8 * Math.cos(angle - 0.4), ay - 8 * Math.sin(angle - 0.4))
      ctx.lineTo(ax - 8 * Math.cos(angle + 0.4), ay - 8 * Math.sin(angle + 0.4))
      ctx.closePath()
      ctx.fillStyle = REL_COLORS[e.relation] || (isDark ? '#3d4f6e' : '#d1d5db')
      ctx.globalAlpha = isDark ? 0.4 : 0.5
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // Draw nodes
    for (const n of nodes) {
      const p = positions[n.id]
      if (!p) continue
      const isHighlighted = n.highlight
      const isSelected = selectedNode?.id === n.id
      const isSearched = search && n.id.toLowerCase().includes(search)
      const r = isHighlighted || isSelected ? 20 : 14

      // Node fill
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)

      if (isSelected) {
        ctx.fillStyle = isDark ? '#6366f1' : '#4f46e5'
      } else if (isHighlighted) {
        ctx.fillStyle = isDark ? '#059669' : '#10b981'
      } else if (isSearched) {
        ctx.fillStyle = isDark ? '#b45309' : '#f59e0b'
      } else {
        ctx.fillStyle = isDark ? '#252f45' : '#e0e7ff'
      }
      ctx.fill()

      // Node stroke
      ctx.strokeStyle = isSelected
        ? (isDark ? '#818cf8' : '#3730a3')
        : isHighlighted
          ? (isDark ? '#34d399' : '#059669')
          : (isDark ? '#3d4f6e' : '#c7d2fe')
      ctx.lineWidth = 2
      ctx.stroke()

      // Label
      const labelColor = (isSelected || isHighlighted)
        ? '#ffffff'
        : (isDark ? '#cbd5e1' : '#374151')

      ctx.fillStyle = labelColor
      ctx.font = `${isHighlighted || isSelected ? 600 : 400} ${r < 18 ? 9 : 10}px Inter,sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const label = n.label || n.id
      ctx.fillText(label.length > 12 ? label.slice(0, 12) + '…' : label, p.x, p.y)
    }

    ctx.restore()
  }, [graphData, zoom, pan, selectedNode, searchTerm, isDark])

  useEffect(() => {
    drawGraph()
  }, [drawGraph])

  const getNodeAt = (mx, my) => {
    const nodes = graphData?.nodes || []
    for (const n of nodes) {
      const p = nodePositions.current[n.id]
      if (!p) continue
      const cx = (p.x * zoom) + pan.x
      const cy = (p.y * zoom) + pan.y
      const r = (n.highlight ? 20 : 14) * zoom
      if (Math.hypot(mx - cx, my - cy) < r) return n
    }
    return null
  }

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    const node = getNodeAt(mx, my)
    if (node) {
      dragging.current = node.id
      setSelectedNode(node)
    } else {
      isDraggingCanvas.current = true
    }
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e) => {
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    lastMouse.current = { x: e.clientX, y: e.clientY }

    if (dragging.current) {
      const p = nodePositions.current[dragging.current]
      if (p) { p.x += dx / zoom; p.y += dy / zoom }
      drawGraph()
    } else if (isDraggingCanvas.current) {
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }))
    }
  }

  const handleMouseUp = () => {
    dragging.current = null
    isDraggingCanvas.current = false
  }

  const handleWheel = (e) => {
    e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)))
  }

  // Legend relationship colors (for the UI legend below the canvas)
  const legendColors = isDark
    ? {
        prerequisite_of: '#d97706',
        related_to:      '#818cf8',
        supports:        '#34d399',
        transferable_to: '#a78bfa',
        part_of:         '#60a5fa',
      }
    : {
        prerequisite_of: '#f59e0b',
        related_to:      '#6366f1',
        supports:        '#10b981',
        transferable_to: '#8b5cf6',
        part_of:         '#3b82f6',
      }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <GitBranch size={22} className="text-[var(--accent)]" /> Skill Knowledge Graph
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {stats
              ? `${stats.node_count} skills · ${stats.edge_count} relationships`
              : 'Interactive skill relationship explorer'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.2))}
            className="btn-secondary text-xs py-1.5 px-2.5"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
            className="btn-secondary text-xs py-1.5 px-2.5"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
            className="btn-secondary text-xs py-1.5 px-2.5"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="input pl-8 w-52"
            placeholder="Search skill…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedNode && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-subtle)] text-[var(--accent)] rounded-lg text-sm font-medium border border-[var(--border)]">
            <Info size={14} /> {selectedNode.label || selectedNode.id}
            <button
              onClick={() => setSelectedNode(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="card overflow-hidden" style={{ height: 540 }}>
        {loading ? (
          <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
            <RefreshCw size={24} className="animate-spin mr-2" /> Loading graph…
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={900}
            height={540}
            style={{ width: '100%', height: '100%', cursor: dragging.current ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
        )}
      </div>

      {/* Legend */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] mb-3">Relationship Types</p>
        <div className="flex flex-wrap gap-4">
          {[
            { rel: 'prerequisite_of', label: 'Prerequisite Of' },
            { rel: 'related_to',      label: 'Related To' },
            { rel: 'supports',        label: 'Supports' },
            { rel: 'transferable_to', label: 'Transferable To' },
            { rel: 'part_of',         label: 'Part Of' },
          ].map(({ rel, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <div className="w-6 h-1 rounded-full" style={{ background: legendColors[rel] }} />
              {label}
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          <span
            className="inline-block w-3 h-3 rounded-full mr-1 align-middle"
            style={{ background: isDark ? '#059669' : '#10b981' }}
          />
          Green nodes = candidate/job skills.
          Drag nodes to reposition. Scroll to zoom. Click a node to inspect.
        </p>
      </div>
    </div>
  )
}
