"use client"

import { useState } from "react"
import { Menu, TrendingUp, Search, Activity, Star, BarChart3, X, ChevronDown, ChevronUp } from "./icons.jsx"
import { DataProcessor } from "./utils.js"

// Header Component - Clean Data-Focused Design
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
      className={`${isDarkTheme ? "bg-[#121212] border-[#2a2a2a]" : "bg-white border-gray-200"} border-b h-14 flex items-center justify-between px-4 z-50`}
    >
      <div className="flex items-center space-x-3">
        <button
          onClick={onSidebarToggle}
          className={`p-1.5 rounded transition-colors ${isDarkTheme ? "hover:bg-[#2a2a2a] text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-600"}`}
        >
          <Menu />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-[#00d4aa] rounded flex items-center justify-center">
            <TrendingUp className="text-white w-4 h-4" />
          </div>
          <span className={`text-base font-bold tracking-tight ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
            TradePro
          </span>
        </div>
      </div>

      {/* Symbol Info - Centralized Focus */}
      <div className="flex items-center space-x-6">
        <div className="flex items-baseline space-x-3">
          <div className={`text-sm font-semibold ${isDarkTheme ? "text-gray-300" : "text-gray-900"}`}>
            {currentSymbol || "SELECT"}
          </div>
          <div className={`text-base font-bold ${isDarkTheme ? "text-white" : "text-black"}`}>
            {symbolInfo?.close ? DataProcessor.formatPrice(symbolInfo.close) : "0.00"}
          </div>
          <div
            className={`text-xs font-medium ${symbolInfo && symbolInfo.change >= 0 ? "text-[#00d4aa]" : "text-[#ef4444]"
              }`}
          >
            {symbolInfo ? DataProcessor.formatChange(symbolInfo.change, symbolInfo.change_pct) : "0.00%"}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Timeframe Selector */}
        <div className="flex items-center bg-transparent space-x-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 py-1 text-xs font-semibold rounded hover:bg-opacity-80 transition-all ${timeframe === tf
                  ? "bg-[#00d4aa] text-white"
                  : `${isDarkTheme ? "text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a]" : "text-gray-500 hover:text-black hover:bg-gray-100"}`
                }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

// Sidebar Component - Fixed Width, No Collapse Issues
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
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar - Fixed width 300px (w-[300px]) and flex-shrink-0 to preventing crushing */}
      <aside
        className={`${isDarkTheme ? "bg-[#121212] border-[#2a2a2a]" : "bg-white border-gray-200"} border-r w-[300px] flex-shrink-0 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full absolute"
          } lg:relative lg:translate-x-0 h-full z-40 flex flex-col`}
        style={{ display: isOpen ? 'flex' : 'none' }}
      >
        {/* Search Header */}
        <div className={`p-3 border-b ${isDarkTheme ? "border-[#2a2a2a]" : "border-gray-200"}`}>
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}
            />
            <input
              type="text"
              placeholder="Search 45 symbols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 text-sm border rounded hover:border-[#00d4aa] transition-colors ${isDarkTheme
                  ? "bg-[#1e1e1e] border-[#333] text-gray-200 focus:border-[#00d4aa] placeholder-gray-600"
                  : "bg-gray-50 border-gray-300 text-gray-900 focus:border-[#00d4aa]"
                } focus:outline-none`}
            />
          </div>
        </div>

        {/* Symbol List - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>
            Watchlist
          </div>
          {filteredSymbols.map((symbol) => (
            <div
              key={symbol}
              onClick={() => {
                onSymbolSelect(symbol)
                if (window.innerWidth < 1024) onClose()
              }}
              className={`group flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors border-l-2 ${currentSymbol === symbol
                  ? "bg-[#00d4aa]/10 border-[#00d4aa]"
                  : `border-transparent ${isDarkTheme ? "hover:bg-[#1e1e1e] hover:border-gray-600" : "hover:bg-gray-50 hover:border-gray-300"}`
                }`}
            >
              <div>
                <div className={`text-sm font-medium ${currentSymbol === symbol ? "text-[#00d4aa]" : isDarkTheme ? "text-gray-300 group-hover:text-white" : "text-gray-700 group-hover:text-black"}`}>
                  {symbol}
                </div>
                <div className={`text-[10px] ${isDarkTheme ? "text-gray-600" : "text-gray-400"}`}>NSE</div>
              </div>
              {currentSymbol === symbol && <TrendingUp className="w-3 h-3 text-[#00d4aa]" />}
            </div>
          ))}
        </div>

        {/* Bottom Config Panel */}
        <div className={`p-4 border-t ${isDarkTheme ? "border-[#2a2a2a]" : "border-gray-200"} bg-opacity-50`}>
          <div className="space-y-3">
            <div>
              <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>Main Overlay</label>
              <select
                value={currentPane1}
                onChange={(e) => onPane1Change(e.target.value)}
                className={`w-full bg-transparent text-sm border-none p-0 focus:ring-0 cursor-pointer ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}
              >
                {features.pane1_features?.map((f) => (
                  <option key={f} value={f} className={isDarkTheme ? "bg-[#1e1e1e]" : "bg-white"}>{features.feature_labels?.[f] || f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${isDarkTheme ? "text-gray-500" : "text-gray-400"}`}>Sub Indicator</label>
              <select
                value={currentPane2}
                onChange={(e) => onPane2Change(e.target.value)}
                className={`w-full bg-transparent text-sm border-none p-0 focus:ring-0 cursor-pointer ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}
              >
                {features.pane2_features?.map((f) => (
                  <option key={f} value={f} className={isDarkTheme ? "bg-[#1e1e1e]" : "bg-white"}>{features.feature_labels?.[f] || f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

// Bottom Panel - Minimalist
export const BottomPanel = ({ currentSymbol, onToggle, isDarkTheme = true }) => {
  return null // Simplification: Removing bottom panel for now to match Zerodha/Groww cleaner look, or can be re-added if user specifically asked, but "Groww style" usually means less clutter.
}