"use client"

import { useRef } from "react"
import Plot from "react-plotly.js"
import { MousePointer, Minus, TrendingUp, Star, Maximize, Settings, Sun, Moon } from "./icons.jsx"

// Technical indicator calculations
function calculateIndicators(ohlc) {
  if (!ohlc?.close) return {}
  const closes = ohlc.close
  const highs = ohlc.high
  const lows = ohlc.low
  const volumes = ohlc.volume || []

  // VWAP
  let vwap = []
  // Ensure volumes exist and match length
  const hasVolumes = volumes && volumes.length === closes.length

  // Use backend VWAP if available and frontend calc not possible, or calculate if volumes exist
  if (ohlc.vwap && ohlc.vwap.length === closes.length && !hasVolumes) {
    // Fallback to backend VWAP if no volume data for recalc
    vwap = ohlc.vwap
  } else if (hasVolumes) {
    let cumulativeTPV = 0
    let cumulativeVolume = 0
    let currentDayEntry = null

    for (let i = 0; i < closes.length; i++) {
      try {
        const dateStr = ohlc.index[i]
        const date = new Date(dateStr)
        // Use simple string comparison for day change to handle various formats
        const dayStr = date.toDateString()

        if (currentDayEntry !== dayStr) {
          cumulativeTPV = 0
          cumulativeVolume = 0
          currentDayEntry = dayStr
        }
      } catch (e) {
        // If date parsing fails, just continue identifying as same day or don't reset
      }

      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3
      const vol = volumes[i] || 0
      const tpv = typicalPrice * vol
      cumulativeTPV += tpv
      cumulativeVolume += vol

      vwap.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : closes[i])
    }
  }

  // EMA 20
  const ema = []
  if (closes.length > 0) {
    const period = 20
    const multiplier = 2 / (period + 1)
    ema[0] = closes[0]
    for (let i = 1; i < closes.length; i++) {
      ema[i] = closes[i] * multiplier + ema[i - 1] * (1 - multiplier)
    }
  }

  // RSI 14
  const rsi = []
  if (closes.length > 14) {
    const period = 14
    const gains = []
    const losses = []
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1]
      gains.push(change > 0 ? change : 0)
      losses.push(change < 0 ? Math.abs(change) : 0)
    }
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      rsi.push(100 - 100 / (1 + rs))
    }
  }
  return { vwap, ema, rsi }
}

export const ChartComponent = ({
  chartData,
  currentPane1,
  currentPane2,
  features,
  error,
  sidebarOpen,
  bottomPanelOpen,
  onThemeToggle,
  isDarkTheme = true,
  chartType = "candlestick",
  onChartTypeChange,
  zoomState,
  onZoomChange,
  showIndicators,
  onIndicatorToggle,
  chartKey,
}) => {
  const mainChartRef = useRef(null)
  const volumeChartRef = useRef(null)

  const chartConfig = {
    responsive: true,
    displayModeBar: false,
    scrollZoom: true,
    doubleClick: "reset+autosize",
    showTips: false,
    modeBarButtonsToRemove: ["pan2d", "select2d", "lasso2d", "resetScale2d"],
  }

  const getMainChartData = () => {
    if (!chartData) return { data: [], layout: {} }
    const { ohlc_data, pane1_data } = chartData
    const traces = []
    const indicators = calculateIndicators(ohlc_data)
    switch (chartType) {
      case "candlestick":
        if (ohlc_data && ohlc_data.index) {
          traces.push({
            type: "candlestick",
            x: ohlc_data.index,
            open: ohlc_data.open,
            high: ohlc_data.high,
            low: ohlc_data.low,
            close: ohlc_data.close,
            increasing: { line: { color: "#10b981", width: 1 }, fillcolor: "rgba(16, 185, 129, 0.3)" },
            decreasing: { line: { color: "#ef4444", width: 1 }, fillcolor: "rgba(239, 68, 68, 0.3)" },
            name: "OHLC",
            showlegend: false,
            hovertemplate:
              "<b>%{x}</b><br>" +
              "Open: ₹%{open}<br>" +
              "High: ₹%{high}<br>" +
              "Low: ₹%{low}<br>" +
              "Close: ₹%{close}<br>" +
              "<extra></extra>",
          })
        }
        break
      case "line":
        if (ohlc_data && ohlc_data.index) {
          traces.push({
            type: "scatter",
            mode: "lines",
            x: ohlc_data.index,
            y: ohlc_data.close,
            line: { color: "#00d4aa", width: 2 },
            name: "Close",
            fill: "none",
            showlegend: false,
          })
        }
        break
      case "area":
        if (ohlc_data && ohlc_data.index) {
          traces.push({
            type: "scatter",
            mode: "lines",
            x: ohlc_data.index,
            y: ohlc_data.close,
            line: { color: "#00d4aa", width: 2 },
            fill: "tozeroy",
            fillcolor: "rgba(0, 212, 170, 0.15)",
            name: "Close",
            showlegend: false,
          })
        }
        break
      case "scatter":
        if (ohlc_data && ohlc_data.index) {
          traces.push({
            type: "scatter",
            mode: "markers",
            x: ohlc_data.index,
            y: ohlc_data.close,
            marker: { color: "#00d4aa", size: 7, symbol: "circle" },
            name: "Close",
            showlegend: false,
          })
        }
        break
      default:
        break
    }

    if (showIndicators?.vwap && indicators.vwap?.length > 0) {
      traces.push({
        type: "scatter",
        mode: "lines",
        x: ohlc_data.index,
        y: indicators.vwap,
        line: { color: "#f59e0b", width: 2 },
        name: "VWAP",
        showlegend: false,
        hovertemplate: "<b>VWAP</b><br>₹%{y:.2f}<extra></extra>",
      })
    }
    if (showIndicators?.ema && indicators.ema?.length > 0) {
      traces.push({
        type: "scatter",
        mode: "lines",
        x: ohlc_data.index,
        y: indicators.ema,
        line: { color: "#8b5cf6", width: 2 },
        name: "EMA(20)",
        showlegend: false,
        hovertemplate: "<b>EMA(20)</b><br>₹%{y:.2f}<extra></extra>",
      })
    }
    if (pane1_data && pane1_data.index) {
      traces.push({
        type: "scatter",
        mode: "lines",
        x: pane1_data.index,
        y: pane1_data.values,
        line: { color: "#00d4aa", width: 2 },
        name: features.feature_labels?.[currentPane1] || currentPane1,
        yaxis: "y2",
        showlegend: false,
        hovertemplate: `<b>${features.feature_labels?.[currentPane1] || currentPane1}</b><br>%{y:.2f}<extra></extra>`,
      })
    }
    const layout = {
      paper_bgcolor: isDarkTheme ? "#0a0a0a" : "#ffffff",
      plot_bgcolor: isDarkTheme ? "#0a0a0a" : "#ffffff",
      font: { color: isDarkTheme ? "#ffffff" : "#000000", family: "Inter, sans-serif", size: 12 },
      margin: { l: 60, r: 60, t: 30, b: 10 },
      xaxis: {
        gridcolor: isDarkTheme ? "#333" : "#e5e5e5",
        zeroline: false,
        color: isDarkTheme ? "#ccc" : "#666",
        rangeslider: { visible: false },
        type: "date",
        showticklabels: false,
        ...(zoomState ? { range: [zoomState.start, zoomState.end] } : {}),
      },
      yaxis: {
        gridcolor: isDarkTheme ? "#333" : "#e5e5e5",
        zeroline: false,
        color: isDarkTheme ? "#ccc" : "#666",
        side: "right",
        domain: [0., 1],  // ⬆️ Main chart gets more space
        // approx 71.5% height
        title: { text: "Price (₹)", font: { size: 10 } },
      },
      yaxis2: {
        gridcolor: isDarkTheme ? "#333" : "#e5e5e5",
        showgrid: false,
        zeroline: false,
        color: "#00d4aa",
        side: "left",
        domain: [1, 0.35],  // ⬆️ Volume chart also gets more space
        overlaying: "y",
        title: { text: currentPane1, font: { size: 10 } },
      },
      showlegend: false,
      dragmode: "zoom",
      hovermode: "x unified",
      transition: {
        duration: 300,
        easing: "cubic-in-out",
      },
    }
    return { data: traces, layout }
  }

  const getVolumeChartData = () => {
    if (!chartData) return { data: [], layout: {} }
    const { pane2_data, volume_colors } = chartData
    const traces = []
    if (pane2_data && pane2_data.index) {
      traces.push({
        type: "bar",
        x: pane2_data.index,
        y: pane2_data.values,
        marker: {
          color: volume_colors || "#00d4aa",
          opacity: 0.7,
        },
        name: features.feature_labels?.[currentPane2] || currentPane2,
        showlegend: false,
        hovertemplate: `<b>${features.feature_labels?.[currentPane2] || currentPane2}</b><br>%{y:,.0f}<extra></extra>`,
      })
    }
    const layout = {
      paper_bgcolor: isDarkTheme ? "#0a0a0a" : "#ffffff",
      plot_bgcolor: isDarkTheme ? "#0a0a0a" : "#ffffff",
      font: { color: isDarkTheme ? "#ffffff" : "#000000", family: "Inter, sans-serif", size: 12 },
      margin: { l: 60, r: 60, t: 10, b: 30 },
      xaxis: {
        gridcolor: isDarkTheme ? "#333" : "#e5e5e5",
        zeroline: false,
        color: isDarkTheme ? "#ccc" : "#666",
        type: "date",
        showticklabels: true,
        ...(zoomState ? { range: [zoomState.start, zoomState.end] } : {}),
      },
      yaxis: {
        gridcolor: isDarkTheme ? "#333" : "#e5e5e5",
        zeroline: false,
        color: isDarkTheme ? "#ccc" : "#666",
        side: "right",
        title: { text: currentPane2, font: { size: 10 } },
        domain: [0, 0.7],  // approx 28.5% height
      },
      showlegend: false,
      dragmode: "zoom",
      hovermode: "x",
    }
    return { data: traces, layout }
  }

  const getRSIChartData = () => {
    if (!chartData || !showIndicators.rsi) return { data: [], layout: {} }
    const { ohlc_data } = chartData
    const { rsi } = calculateIndicators(ohlc_data)
    if (!rsi?.length) return { data: [], layout: {} }
    return {
      data: [{
        type: "scatter",
        mode: "lines",
        x: ohlc_data.index.slice(14),
        y: rsi,
        line: { color: "#f97316", width: 2 },
        name: "RSI(14)",
        showlegend: false,
        hovertemplate: "<b>RSI(14)</b><br>%{y:.2f}<extra></extra>",
      }],
      layout: {
        paper_bgcolor: isDarkTheme ? "#0a0a0a" : "#ffffff",
        plot_bgcolor: isDarkTheme ? "#0a0a0a" : "#ffffff",
        font: { color: isDarkTheme ? "#ffffff" : "#000000", family: "Inter, sans-serif", size: 12 },
        height: 120,
        margin: { l: 60, r: 60, t: 10, b: 30 },
        xaxis: {
          gridcolor: isDarkTheme ? "#333" : "#e5e5e5",
          zeroline: false,
          color: isDarkTheme ? "#ccc" : "#666",
          type: "date",
          showticklabels: true,
          ...(zoomState ? { range: [zoomState.start, zoomState.end] } : {}),
        },
        yaxis: {
          gridcolor: isDarkTheme ? "#333" : "#e5e5e5",
          zeroline: false,
          color: isDarkTheme ? "#ccc" : "#666",
          side: "right",
          title: { text: "RSI", font: { size: 10 } },
          range: [0, 100],
        },
        showlegend: false,
        dragmode: "zoom",
        hovermode: "x",
      }
    }
  }

  const tools = [
    { id: "pointer", icon: MousePointer, label: "Pointer" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "trend", icon: TrendingUp, label: "Trend" },
    { id: "fib", icon: Star, label: "Fibonacci" },
  ]
  const indicators = [
    { id: "vwap", label: "VWAP", active: showIndicators?.vwap, color: "#f59e0b" },
    { id: "rsi", label: "RSI", active: showIndicators?.rsi, color: "#f97316" },
    { id: "ema", label: "EMA", active: showIndicators?.ema, color: "#8b5cf6" },
  ]
  const handleRelayout = (eventData, source) => {
    if ("xaxis.range[0]" in eventData && "xaxis.range[1]" in eventData) {
      const range = { start: eventData["xaxis.range[0]"], end: eventData["xaxis.range[1]"] }
      if (!zoomState || zoomState.start !== range.start || zoomState.end !== range.end || chartSyncSource !== source) {
        onZoomChange(range, source)
      }
    }
  }

  const mainChart = getMainChartData()
  const volumeChart = getVolumeChartData()
  const rsiChart = getRSIChartData()

  return (
    <div className="flex-1 flex flex-col bg-dark">
      {/* Chart Toolbar */}
      <div
        className={`${isDarkTheme ? "bg-secondary-900" : "bg-gray-100"} border-b ${isDarkTheme ? "border-accent-700" : "border-gray-300"} p-3 flex items-center justify-between glass`}
      >
        <div className="flex items-center space-x-2">
          {tools.map((tool) => {
            const IconComponent = tool.icon
            return (
              <button
                key={tool.id}
                onClick={() => { }}
                className="p-2 rounded transition-all duration-200 hover:scale-105"
                title={tool.label}
                aria-pressed={false}
              >
                <IconComponent />
              </button>
            )
          })}
          <div className={`w-px h-6 ${isDarkTheme ? "bg-accent-700" : "bg-gray-300"} mx-2`} />
          {indicators.map((indicator) => (
            <button
              key={indicator.id}
              onClick={() => onIndicatorToggle(indicator.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all duration-200`}
              aria-pressed={indicator.active}
              style={{
                backgroundColor: indicator.active ? indicator.color : "transparent",
                border: `1px solid ${indicator.color}`,
                color: indicator.active ? "#000" : (isDarkTheme ? "#ccc" : "#444"),
              }}
            >
              {indicator.label}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <div className={`text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
            <span className="text-primary">{currentPane1}</span> |{" "}
            <span className="text-warning-500">{currentPane2}</span>
          </div>
          {error && <div className={`text-xs text-danger-500 bg-danger-500/10 px-2 py-1 rounded`}>{error}</div>}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onThemeToggle}
            className={`p-2 rounded transition-all duration-200 hover:scale-105 ${isDarkTheme ? "bg-accent-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            title="Toggle Theme"
          >
            {isDarkTheme ? <Sun /> : <Moon />}
          </button>
          <button className="p-2 rounded transition-all duration-200" aria-label="Settings">
            <Settings />
          </button>
          <button className="p-2 rounded transition-all duration-200" aria-label="Maximize">
            <Maximize />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-[2.5] min-h-0">{/* Main chart Plot component */}<Plot key={`main-${chartKey}`} ref={mainChartRef} data={mainChart.data} layout={mainChart.layout} config={chartConfig} style={{ width: "100%", height: "100%" }} onRelayout={(eventData) => handleRelayout(eventData, "main")} data-chart="main" /></div>
        <div className="flex-1 min-h-0">{/* Volume chart Plot component */}<Plot key={`volume-${chartKey}`} ref={volumeChartRef} data={volumeChart.data} layout={volumeChart.layout} config={chartConfig} style={{ width: "100%", height: "100%" }} onRelayout={(eventData) => handleRelayout(eventData, "volume")} data-chart="volume" /></div>
        {showIndicators?.rsi && rsiChart.data.length > 0 && (
          <div className="flex-[0.7] min-h-0">
            <Plot key={`rsi-${chartKey}`} data={rsiChart.data} layout={rsiChart.layout} config={{ ...chartConfig, displayModeBar: false }} style={{ width: "100%", height: "100%" }} data-chart="rsi" />
          </div>
        )}
      </div>
    </div>
  )
}