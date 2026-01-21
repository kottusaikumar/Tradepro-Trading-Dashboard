# TradePro Dashboard

A professional trading dashboard featuring dynamic feature loading, charts, and technical indicators.

## Overview

TradePro Dashboard is a full-stack application designed for visualizing trading data. It consists of:
- **Backend**: A Flask-based Python server that processes data from a local file based dataset (`Server/` directory) and maps features dynamically using an Excel configuration file (`Charts_dataset.xlsx`).
- **Frontend**: A React-based single-page application (SPA) built with Vite and Tailwind CSS, featuring interactive Plotly charts.
- **Live Demo**: [https://lovely-actors-lie.loca.lt](https://lovely-actors-lie.loca.lt) (Requires local server running)

## Features

- **Dynamic Data Loading**: Features are mapped from `Charts_dataset.xlsx`, allowing flexibility in what data is displayed without changing code.
- **Interactive Charts**: Candlestick, Line, Area, and Scatter plots.
- **Technical Indicators**: VWAP, EMA(20), RSI(14).
- **Multi-Pane Layout**: Support for multiple analysis panes (e.g., Price, Volume, Custom Indicators).
- **Theme Support**: Dark and Light mode.

## Project Structure

```
.
├── app.py                  # Flask Backend Entry Point
├── Charts_dataset.xlsx     # Configuration for feature mapping
├── Server/                 # Data directory containing symbol folders and CSV/RAR files
├── App.jsx                 # Main React Frontend Component
├── charts.jsx              # Plotly Chart Components
├── components.jsx          # UI Components (Header, Sidebar, etc.)
├── utils.js                # Frontend Utilities & API Client
├── package.json            # Frontend Dependencies
└── requirements.txt        # Backend Dependencies
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+

### 1. Backend Setup

1.  Create a virtual environment:
    ```bash
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # Mac/Linux
    source .venv/bin/activate
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run the server:
    ```bash
    python app.py
    ```
    The server will start at `http://127.0.0.1:5000`.

### 2. Frontend Setup

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Configuration

Modify `Charts_dataset.xlsx` to add or change the features displayed on the dashboard.
- **VariableName**: The name of the feature column in your CSV files.
- **Draw**: Set to `TRUE` to display this feature.
- **PaneNumber**: `1` for the main price chart, `2` for the volume/sub-chart.
- **File Name**: The specific CSV file (suffix) where this feature is located.
