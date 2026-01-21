"use client"
import { useState, useEffect } from "react"
import { createRoot } from "react-dom/client"
import { APIClient, Storage } from "./utils.js"
import { Header, Sidebar, BottomPanel } from "./components.jsx"
import { ChartComponent } from "./charts.jsx"

const chartTypes = [
  { value: "candlestick", label: "Candlestick" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "scatter", label: "Scatter" },
]

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== "undefined" ? window.innerWidth >= 1024 : true)
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true)
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  const [currentSymbol, setCurrentSymbol] = useState("")
  const [currentTimeframe, setCurrentTimeframe] = useState("1D")
  const [currentPane1, setCurrentPane1] = useState("CurrentPrice")
  const [currentPane2, setCurrentPane2] = useState("AllExchangesVolume")
  const [symbols, setSymbols] = useState([])
  const [features, setFeatures] = useState({ pane1_features: [], pane2_features: [], feature_labels: {} })
  const [chartData, setChartData] = useState(null)
  const [symbolInfo, setSymbolInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [chartType, setChartType] = useState("candlestick")
  const [chartKey, setChartKey] = useState(0)
  const [zoomState, setZoomState] = useState(null)
  const [chartSyncSource, setChartSyncSource] = useState(null)

  // Indicators default OFF, feel free to adjust
  const [showIndicators, setShowIndicators] = useState({
    vwap: false,
    rsi: false,
    ema: false,
  })

  const api = new APIClient()

  useEffect(() => {
    loadLocalDataset()
    loadUserPreferences()
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(true)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (symbols.length > 0 && currentSymbol) updateChartData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSymbol, currentTimeframe, currentPane1, currentPane2])

  useEffect(() => {
    saveUserPreferences()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSymbol, currentTimeframe, currentPane1, currentPane2, sidebarOpen, bottomPanelOpen, isDarkTheme, chartType, showIndicators])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkTheme)
    document.body.style.backgroundColor = isDarkTheme ? "#0a0a0a" : "#ffffff"
    document.body.style.color = isDarkTheme ? "#ffffff" : "#000000"
  }, [isDarkTheme])

  const loadLocalDataset = async () => {
    try {
      setLoading(true)
      setError(null)
      const [symbolsResponse, featuresResponse] = await Promise.all([
        api.getSymbols().catch(() => ({ symbols: [] })),
        api.getFeatures().catch(() => ({
          pane1_features: ["CurrentPrice", "Open", "High", "Low", "Close"],
          pane2_features: ["AllExchangesVolume", "Volume"],
          feature_labels: { CurrentPrice: "Current Price", AllExchangesVolume: "Volume" },
        })),
      ])
      const localSymbols = symbolsResponse.symbols || []
      setSymbols(localSymbols)
      setFeatures(featuresResponse)
      if (localSymbols.length > 0 && !currentSymbol) setCurrentSymbol(localSymbols[0])
      if (featuresResponse.pane1_features?.length > 0) setCurrentPane1(featuresResponse.pane1_features[0])
      if (featuresResponse.pane2_features?.length > 0) setCurrentPane2(featuresResponse.pane2_features[0])
    } catch {
      setError("Failed to load local dataset. Please check your data directory.")
    } finally {
      setLoading(false)
    }
  }

  const updateChartData = async () => {
    if (!currentSymbol) return
    try {
      setError(null)
      const response = await api.getChartData(currentSymbol, currentTimeframe, currentPane1, currentPane2)
      if (response.chart_data) {
        setChartData(response.chart_data)
        setSymbolInfo(response.symbol_info)
        setLastUpdate(new Date())
        setZoomState(null)
        setChartSyncSource(null)
        setChartKey((k) => k + 1)
      } else {
        setError(`No data found for symbol ${currentSymbol}`)
      }
    } catch {
      setError(`Failed to load data for ${currentSymbol}`)
    }
  }

  const loadUserPreferences = () => {
    const preferences = Storage.get("tradingDashboardPrefs", {})
    if (preferences.symbol) setCurrentSymbol(preferences.symbol)
    if (preferences.timeframe) setCurrentTimeframe(preferences.timeframe)
    if (preferences.pane1) setCurrentPane1(preferences.pane1)
    if (preferences.pane2) setCurrentPane2(preferences.pane2)
    if (preferences.sidebarOpen !== undefined) setSidebarOpen(preferences.sidebarOpen)
    if (preferences.bottomPanelOpen !== undefined) setBottomPanelOpen(preferences.bottomPanelOpen)
    if (preferences.isDarkTheme !== undefined) setIsDarkTheme(preferences.isDarkTheme)
    if (preferences.chartType) setChartType(preferences.chartType)
    if (preferences.showIndicators) setShowIndicators(preferences.showIndicators)
  }

  const saveUserPreferences = () => {
    const preferences = {
      symbol: currentSymbol,
      timeframe: currentTimeframe,
      pane1: currentPane1,
      pane2: currentPane2,
      sidebarOpen,
      bottomPanelOpen,
      isDarkTheme,
      chartType,
      showIndicators,
    }
    Storage.set("tradingDashboardPrefs", preferences)
  }

  const handleSidebarToggle = () => {
    setSidebarOpen((open) => !open)
    setTimeout(() => {
      if (window.Plotly) {
        Array.from(document.querySelectorAll("[data-chart]")).forEach(el => window.Plotly.Plots.resize(el))
      }
    }, 350)
  }

  const handleSidebarClose = () => setSidebarOpen(false)
  const handleBottomPanelToggle = () => setBottomPanelOpen((open) => !open)
  const handleThemeToggle = () => setIsDarkTheme((t) => !t)
  const handleZoomChange = (range, source) => {
    if (!range) return
    setZoomState(range)
    setChartSyncSource(source)
  }
  const handleIndicatorToggle = (indicator) => {
    setShowIndicators((prev) => {
      const next = { ...prev, [indicator]: !prev[indicator] }
      Storage.set("tradingDashboardPrefs", { ...Storage.get("tradingDashboardPrefs", {}), showIndicators: next })
      return next
    })
  }
  const handleChartTypeChange = (type) => setChartType(type)

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkTheme ? "bg-dark" : "bg-white"}`}>
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className={`text-lg ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>Loading Local Dataset...</p>
          <p className={`text-sm mt-2 ${isDarkTheme ? "text-gray-500" : "text-gray-500"}`}>Reading from local files...</p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDarkTheme ? "bg-dark text-white" : "bg-white text-black"}`}>
      {/* Chart type buttons (now more compact!) */}
      <div
        className={`flex items-center overflow-x-auto space-x-1 scrollbar-thin bg-secondary-900 rounded px-2 py-1 border border-accent-700`}
        style={{ maxWidth: 320, position: "absolute", top: 12, right: 24, zIndex: 40 }}
      >
        {chartTypes.map(ct => (
          <button
            key={ct.value}
            className={`px-1.5 py-1 rounded font-medium text-xs transition-colors ${
              chartType === ct.value
                ? "bg-primary text-black shadow-glow"
                : "text-gray-400 hover:text-white hover:bg-accent-700"
            }`}
            onClick={() => handleChartTypeChange(ct.value)}
            style={{ minWidth: 62, maxWidth: 96, outline: "none" }}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-danger-500/20 border-b border-danger-500/50 px-4 py-2 text-center">
          <span className="text-danger-500 text-sm">{error}</span>
          <button
            onClick={loadLocalDataset}
            className="ml-4 text-xs bg-danger-500/20 hover:bg-danger-500/30 px-2 py-1 rounded transition-colors"
          >
            Reload Dataset
          </button>
        </div>
      )}

      <Header
        currentSymbol={currentSymbol}
        symbolInfo={symbolInfo}
        timeframe={currentTimeframe}
        onTimeframeChange={setCurrentTimeframe}
        onSidebarToggle={handleSidebarToggle}
        connectionStatus={true}
        isDarkTheme={isDarkTheme}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          symbols={symbols}
          currentSymbol={currentSymbol}
          onSymbolSelect={setCurrentSymbol}
          features={features}
          currentPane1={currentPane1}
          currentPane2={currentPane2}
          onPane1Change={setCurrentPane1}
          onPane2Change={setCurrentPane2}
          onClose={handleSidebarClose}
          isDarkTheme={isDarkTheme}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChartComponent
            chartData={chartData}
            currentPane1={currentPane1}
            currentPane2={currentPane2}
            features={features}
            error={error}
            sidebarOpen={sidebarOpen}
            bottomPanelOpen={bottomPanelOpen}
            onThemeToggle={handleThemeToggle}
            isDarkTheme={isDarkTheme}
            chartType={chartType}
            onChartTypeChange={handleChartTypeChange}
            zoomState={zoomState}
            onZoomChange={handleZoomChange}
            showIndicators={showIndicators}
            onIndicatorToggle={handleIndicatorToggle}
            chartKey={chartKey}
          />
          {bottomPanelOpen && (
            <BottomPanel currentSymbol={currentSymbol} onToggle={handleBottomPanelToggle} isDarkTheme={isDarkTheme} />
          )}
        </div>
      </div>
      <div
        className={`${isDarkTheme ? "bg-secondary-900 border-accent-700" : "bg-gray-100 border-gray-300"
          } border-t px-4 py-2 text-xs flex justify-between items-center`}
      >
        <div className="flex items-center space-x-4">
          <span className={isDarkTheme ? "text-gray-400" : "text-gray-600"}>Mode: Local Dataset</span>
          <span className={isDarkTheme ? "text-gray-400" : "text-gray-600"}>
            Last Update: {lastUpdate ? lastUpdate.toLocaleTimeString() : "Never"}
          </span>
          <span className={isDarkTheme ? "text-gray-400" : "text-gray-600"}>Symbol: {currentSymbol || "None"}</span>
          <span className={isDarkTheme ? "text-gray-400" : "text-gray-600"}>Symbols Available: {symbols.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <span className={isDarkTheme ? "text-gray-400" : "text-gray-600"}>Local Dataset Ready</span>
        </div>
      </div>
    </div>
  )
}

// Initialize the app
const container = document.getElementById("root")
const root = createRoot(container)
root.render(<App />)

export default App
