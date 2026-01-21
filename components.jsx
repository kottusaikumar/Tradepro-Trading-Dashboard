"use client"

import { useState } from "react"
import { Menu, TrendingUp, Search, Activity, Star, BarChart3, X, ChevronDown, ChevronUp } from "./icons.jsx"
import { DataProcessor } from "./utils.js"

// Header Component - Enhanced with theme support
export const Header = ({
  currentSymbol,
  symbolInfo,
  timeframe,
  onTimeframeChange,
  onSidebarToggle,
  connectionStatus,
  isDarkTheme = true,
}) => {
  const timeframes = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"]

  return (
    <header
      className={`${isDarkTheme ? "bg-secondary-900 border-accent-700" : "bg-gray-100 border-gray-300"} border-b h-16 flex items-center justify-between px-4 glass`}
    >
      <div className="flex items-center space-x-4">
        <button
          onClick={onSidebarToggle}
          className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${isDarkTheme ? "hover:bg-accent-700" : "hover:bg-gray-200"}`}
          aria-label="Toggle sidebar"
        >
          <Menu />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="text-black w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
            TradePro
          </span>
        </div>
      </div>

      {/* Symbol Info */}
      <div className="flex items-center space-x-6">
        <div className="text-center">
          <div className={`text-lg font-semibold ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
            {currentSymbol || "Select Symbol"}
          </div>
          <div className="text-2xl font-bold text-primary">
            {symbolInfo?.close ? DataProcessor.formatPrice(symbolInfo.close) : "₹0.00"}
          </div>
          <div
            className={`text-sm px-3 py-1 rounded-full font-medium ${
              symbolInfo && symbolInfo.change >= 0
                ? "bg-success-500/20 text-success-500 shadow-glow-success"
                : "bg-danger-500/20 text-danger-500 shadow-glow-danger"
            }`}
          >
            {symbolInfo ? DataProcessor.formatChange(symbolInfo.change, symbolInfo.change_pct) : "+0.00 (0.00%)"}
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div
        className={`flex items-center space-x-1 rounded-lg p-1 glass ${isDarkTheme ? "bg-accent-700" : "bg-gray-200"}`}
      >
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 ${
              timeframe === tf
                ? "bg-gradient-primary text-black shadow-glow"
                : `${isDarkTheme ? "text-gray-300 hover:text-white hover:bg-gray-600" : "text-gray-600 hover:text-gray-800 hover:bg-gray-300"}`
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Local Dataset Status */}
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-primary"></div>
        <span className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>Local Dataset</span>
      </div>
    </header>
  )
}

// Sidebar Component - Enhanced with theme support
export const Sidebar = ({
  isOpen,
  symbols,
  currentSymbol,
  onSymbolSelect,
  features,
  currentPane1,
  currentPane2,
  onPane1Change,
  onPane2Change,
  onClose,
  isDarkTheme = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSymbols = symbols.filter((symbol) => symbol.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={`${isDarkTheme ? "bg-secondary-900 border-accent-700" : "bg-gray-100 border-gray-300"} border-r w-80 flex-shrink-0 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:relative lg:translate-x-0 h-full z-50 glass`}
      >
        <div className="h-full flex flex-col">
          {/* Mobile Close Button */}
          <div
            className={`lg:hidden flex justify-between items-center p-4 border-b ${isDarkTheme ? "border-accent-700" : "border-gray-300"}`}
          >
            <h2 className="text-lg font-semibold text-primary">Local Dataset</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 ${isDarkTheme ? "hover:bg-accent-700" : "hover:bg-gray-200"}`}
            >
              <X />
            </button>
          </div>

          {/* Local Symbols Section */}
          <div className={`p-4 border-b ${isDarkTheme ? "border-accent-700" : "border-gray-300"}`}>
            <h3 className="text-primary text-sm font-semibold uppercase tracking-wider mb-3 flex items-center">
              <Activity className="mr-2 w-4 h-4" />
              Local Symbols ({symbols.length})
            </h3>

            {symbols.length > 0 && (
              <div className="relative mb-3">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
                />
                <input
                  type="text"
                  placeholder="Search local symbols..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-all ${
                    isDarkTheme
                      ? "bg-accent-700 border-gray-600 text-white placeholder-gray-400 focus:border-primary"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-primary"
                  } focus:outline-none focus:ring-1 focus:ring-primary`}
                />
              </div>
            )}

            <div className="max-h-48 overflow-y-auto scrollbar-thin">
              {filteredSymbols.length > 0 ? (
                filteredSymbols.map((symbol) => (
                  <div
                    key={symbol}
                    onClick={() => {
                      onSymbolSelect(symbol)
                      if (window.innerWidth < 1024) onClose()
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 mb-1 ${
                      currentSymbol === symbol
                        ? "bg-gradient-primary text-black shadow-glow"
                        : `${isDarkTheme ? "hover:bg-accent-700/70" : "hover:bg-gray-200"}`
                    }`}
                  >
                    <span className="font-medium">{symbol}</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                ))
              ) : symbols.length > 0 ? (
                <div className={`text-center py-4 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No symbols match "{searchTerm}"</p>
                </div>
              ) : (
                <div className={`text-center py-4 ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No local symbols found</p>
                  <p className="text-xs mt-1">Check your dataset directory</p>
                </div>
              )}
            </div>
          </div>

          {/* Chart Features Section */}
          <div className="p-4 flex-1">
            <h3 className="text-primary text-sm font-semibold uppercase tracking-wider mb-3 flex items-center">
              <BarChart3 className="mr-2 w-4 h-4" />
              Chart Features
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-xs uppercase tracking-wider mb-2 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
                >
                  Pane 1 Feature ({features.pane1_features?.length || 0} available)
                </label>
                <select
                  value={currentPane1}
                  onChange={(e) => onPane1Change(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all ${
                    isDarkTheme
                      ? "bg-accent-700 border-gray-600 text-white focus:border-primary"
                      : "bg-white border-gray-300 text-gray-900 focus:border-primary"
                  } focus:outline-none focus:ring-1 focus:ring-primary`}
                  disabled={!features.pane1_features?.length}
                >
                  {features.pane1_features?.length > 0 ? (
                    features.pane1_features.map((feature) => (
                      <option key={feature} value={feature}>
                        {features.feature_labels?.[feature] || feature}
                      </option>
                    ))
                  ) : (
                    <option value="">No features available</option>
                  )}
                </select>
              </div>

              <div>
                <label
                  className={`block text-xs uppercase tracking-wider mb-2 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
                >
                  Pane 2 Feature ({features.pane2_features?.length || 0} available)
                </label>
                <select
                  value={currentPane2}
                  onChange={(e) => onPane2Change(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all ${
                    isDarkTheme
                      ? "bg-accent-700 border-gray-600 text-white focus:border-primary"
                      : "bg-white border-gray-300 text-gray-900 focus:border-primary"
                  } focus:outline-none focus:ring-1 focus:ring-primary`}
                  disabled={!features.pane2_features?.length}
                >
                  {features.pane2_features?.length > 0 ? (
                    features.pane2_features.map((feature) => (
                      <option key={feature} value={feature}>
                        {features.feature_labels?.[feature] || feature}
                      </option>
                    ))
                  ) : (
                    <option value="">No features available</option>
                  )}
                </select>
              </div>
            </div>

            {/* Dataset Info */}
            <div className={`mt-6 p-3 rounded-lg ${isDarkTheme ? "bg-accent-700/50" : "bg-gray-200"}`}>
              <h4
                className={`text-xs uppercase tracking-wider mb-2 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
              >
                Dataset Status
              </h4>
              <div className={`text-sm space-y-1 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="text-primary">Local Only</span>
                </div>
                <div className="flex justify-between">
                  <span>Symbols:</span>
                  <span className={symbols.length > 0 ? "text-success-500" : "text-danger-500"}>{symbols.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Features:</span>
                  <span>{(features.pane1_features?.length || 0) + (features.pane2_features?.length || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={symbols.length > 0 ? "text-success-500" : "text-warning-500"}>
                    {symbols.length > 0 ? "Ready" : "No Data"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

// Bottom Panel Component - Enhanced with collapsible functionality
export const BottomPanel = ({ currentSymbol, onToggle, isDarkTheme = true }) => {
  const [activeTab, setActiveTab] = useState("dataset")
  const [isCollapsed, setIsCollapsed] = useState(false)

  const tabs = [
    { id: "dataset", label: "Dataset Info", icon: Activity },
    { id: "features", label: "Features", icon: BarChart3 },
    { id: "analysis", label: "Analysis", icon: TrendingUp },
    { id: "export", label: "Export", icon: Star },
  ]

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    if (onToggle) onToggle()
  }

  return (
    <div
      className={`${isDarkTheme ? "bg-secondary-900 border-accent-700" : "bg-gray-100 border-gray-300"} border-t flex flex-col glass transition-all duration-300 ${isCollapsed ? "h-12" : "h-64"}`}
    >
      {/* Tabs with Collapse Button */}
      <div
        className={`flex ${isDarkTheme ? "bg-accent-700 border-gray-600" : "bg-gray-200 border-gray-300"} border-b overflow-x-auto`}
      >
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 flex items-center space-x-2 hover:scale-105 whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-primary border-primary shadow-glow"
                  : `${isDarkTheme ? "text-gray-300 border-transparent hover:text-white hover:bg-gray-600" : "text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-300"}`
              } ${isCollapsed ? "bg-secondary-900" : ""}`}
            >
              <IconComponent />
              <span>{tab.label}</span>
            </button>
          )
        })}

        <div className="flex-1" />

        <button
          onClick={handleToggleCollapse}
          className={`px-4 py-3 transition-all duration-200 flex items-center ${isDarkTheme ? "hover:bg-gray-600 text-gray-400" : "hover:bg-gray-300 text-gray-600"}`}
          title={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        >
          {isCollapsed ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {activeTab === "dataset" && (
            <div className="p-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-lg text-center glass hover:scale-105 transition-all duration-200 ${isDarkTheme ? "bg-accent-700" : "bg-gray-200"}`}
                >
                  <h4
                    className={`text-xs uppercase tracking-wider mb-2 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Current Symbol
                  </h4>
                  <div className="text-xl font-bold text-primary">{currentSymbol || "None Selected"}</div>
                </div>
                <div
                  className={`p-4 rounded-lg text-center glass hover:scale-105 transition-all duration-200 ${isDarkTheme ? "bg-accent-700" : "bg-gray-200"}`}
                >
                  <h4
                    className={`text-xs uppercase tracking-wider mb-2 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Data Source
                  </h4>
                  <div className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Local Files</div>
                </div>
                <div
                  className={`p-4 rounded-lg text-center glass hover:scale-105 transition-all duration-200 ${isDarkTheme ? "bg-accent-700" : "bg-gray-200"}`}
                >
                  <h4
                    className={`text-xs uppercase tracking-wider mb-2 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Mode
                  </h4>
                  <div className="text-xl font-bold text-success-500">Offline</div>
                </div>
                <div
                  className={`p-4 rounded-lg text-center glass hover:scale-105 transition-all duration-200 ${isDarkTheme ? "bg-accent-700" : "bg-gray-200"}`}
                >
                  <h4
                    className={`text-xs uppercase tracking-wider mb-2 ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Status
                  </h4>
                  <div className="text-xl font-bold text-primary">Ready</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "features" && (
            <div className="p-4">
              <div className={`text-center ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chart Features Configuration</p>
                <p className="text-sm mt-2">Technical indicators: VWAP, RSI, EMA available</p>
              </div>
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="p-4">
              <div className={`text-center ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Technical Analysis</p>
                <p className="text-sm mt-2">Drawing tools and analysis features</p>
              </div>
            </div>
          )}

          {activeTab === "export" && (
            <div className="p-4">
              <div className={`text-center ${isDarkTheme ? "text-gray-400" : "text-gray-600"}`}>
                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Export Data</p>
                <p className="text-sm mt-2">Export local dataset analysis results</p>
                <button className="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors">
                  Export CSV
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}