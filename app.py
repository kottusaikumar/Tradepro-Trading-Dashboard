"""
TradePro Dashboard Backend - Dynamic Feature Loading with Excel Mapping
Fixed to properly load features based on Charts_dataset.xlsx mapping
"""

import os
import pandas as pd
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime, timedelta
import rarfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# ------------------------------------------------------------------
# 1. PATHS - Local Dataset Only
# ------------------------------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
STRATEGY_MATRIX_PATH = os.path.join(CURRENT_DIR, "Charts_dataset.xlsx")
BASE_DIR = os.path.join(CURRENT_DIR, "Server")

# Global variables for configuration
features_df = pd.DataFrame()
feature_labels = {}
feature_pane_mapping = {}
feature_file_mapping = {}  # NEW: Maps feature names to their file names

# ------------------------------------------------------------------
# 2. TIME RANGES - Local Data Processing
# ------------------------------------------------------------------
TIME_RANGES = {
    "1m": {"days": 1, "resample": "1T", "title": "1 Minute"},
    "5m": {"days": 5, "resample": "5T", "title": "5 Minutes"},
    "15m": {"days": 15, "resample": "15T", "title": "15 Minutes"},
    "30m": {"days": 30, "resample": "30T", "title": "30 Minutes"},
    "1H": {"days": 30, "resample": "1H", "title": "1 Hour"},
    "4H": {"days": 120, "resample": "4H", "title": "4 Hours"},
    "1D": {"days": 365, "resample": "1D", "title": "1 Day"},
    "1W": {"days": 365 * 2, "resample": "1W", "title": "1 Week"},
    "1M": {"days": 365 * 5, "resample": "1M", "title": "1 Month"}
}

# ------------------------------------------------------------------
# 3. UTILITIES
# ------------------------------------------------------------------
def find_date_column(df):
    """Find the date/time column in dataframe"""
    for col in df.columns:
        if any(keyword in col.lower() for keyword in ['time', 'date', 'timestamp']):
            return col
    return df.columns[0] if len(df.columns) > 0 else None

def parse_datetime_series(series):
    """Parse datetime series with multiple format support"""
    try:
        # Try numeric timestamp first
        numeric = pd.to_numeric(series, errors='coerce')
        if numeric.notna().all():
            return pd.to_datetime(numeric, unit='s')
        # Fall back to string parsing
        return pd.to_datetime(series, errors='coerce')
    except Exception as e:
        logger.warning(f"DateTime parsing error: {e}")
        return pd.to_datetime(series, errors='coerce')

# ------------------------------------------------------------------
# 4. EXCEL CONFIGURATION LOADING - FIXED
# ------------------------------------------------------------------
def load_configuration():
    """Load feature configuration from Excel file with proper mapping"""
    global features_df, feature_labels, feature_pane_mapping, feature_file_mapping

    try:
        if not os.path.exists(STRATEGY_MATRIX_PATH):
            logger.warning(f"Configuration file not found at {STRATEGY_MATRIX_PATH}")
            return create_default_config()

        logger.info(f"Loading configuration from {STRATEGY_MATRIX_PATH}")
        config_df = pd.read_excel(STRATEGY_MATRIX_PATH)

        # Clean column names - remove prefixes like "ColumnName:", "VariableName:"
        clean_cols = []
        for col in config_df.columns:
            if ':' in str(col):
                clean_cols.append(str(col).split(':', 1)[-1].strip())
            else:
                clean_cols.append(str(col).strip())
        config_df.columns = clean_cols

        logger.info(f"Configuration columns: {list(config_df.columns)}")
        logger.info("Expected columns: VariableName, Draw, PaneNumber, Axis_X, Axis_Y, File Name")

        # Check for required columns
        required_columns = ['VariableName', 'Draw', 'PaneNumber', 'File Name']
        missing_columns = [col for col in required_columns if col not in config_df.columns]
        if missing_columns:
            logger.error(f"Missing required columns in Excel file: {missing_columns}")
            return create_default_config()

        # Convert boolean columns
        def to_bool(val):
            if pd.isna(val):
                return False
            s = str(val).strip().lower()
            return s in {'1', '1.0', 'true', 'yes', 'y'}

        for col in ['Draw', 'Axis_X', 'Axis_Y']:
            if col in config_df.columns:
                config_df[col] = config_df[col].apply(to_bool)

        # Convert PaneNumber to int
        if 'PaneNumber' in config_df.columns:
            config_df['PaneNumber'] = pd.to_numeric(
                config_df['PaneNumber'], errors='coerce'
            ).fillna(0).astype(int)

        # Filter drawable features - ONLY features with Draw=TRUE
        if 'Axis_X'  in config_df.columns:
            features_df = config_df[config_df['Draw'] == True].copy()
        else:
            features_df = config_df.copy()

        # Create feature mappings - FIXED TO USE EXCEL DATA
        feature_labels = {}
        feature_pane_mapping = {}
        feature_file_mapping = {}  # NEW: Critical mapping

        for _, row in features_df.iterrows():
            var_name = row.get('VariableName', '')
            file_name = row.get('File Name', '')  # Get the file name from Excel
            pane_num = row.get('PaneNumber', 1)

            if pd.notna(var_name) and var_name:
                var_name_str = str(var_name).strip()

                # Feature label (no DisplayName column, so use VariableName as label)
                feature_labels[var_name_str] = var_name_str

                # Pane mapping
                feature_pane_mapping[var_name_str] = int(pane_num) if pd.notna(pane_num) else 1

                # FILE MAPPING - This is the key fix!
                if pd.notna(file_name) and file_name:
                    feature_file_mapping[var_name_str] = str(file_name).strip()
                    logger.info(f"Mapped feature '{var_name_str}' to file '{file_name}' in pane {pane_num}")

        logger.info(f"✅ Loaded {len(features_df)} features from Excel configuration")
        logger.info(f"Feature labels: {feature_labels}")
        logger.info(f"Pane mapping: {feature_pane_mapping}")
        logger.info(f"File mapping: {feature_file_mapping}")

        return features_df, feature_labels, feature_pane_mapping, feature_file_mapping

    except Exception as e:
        logger.error(f"❌ Error loading configuration: {e}")
        return create_default_config()

def create_default_config():
    """Create default configuration when Excel is not available"""
    global features_df, feature_labels, feature_pane_mapping, feature_file_mapping

    logger.info("Creating default configuration")
    features_df = pd.DataFrame()
    feature_labels = {
        'CurrentPrice': 'Current Price',
        'AllExchangesVolume': 'Volume'
    }
    feature_pane_mapping = {
        'CurrentPrice': 1,
        'AllExchangesVolume': 2
    }
    feature_file_mapping = {
        'CurrentPrice': '_TSD.csv',  # Default assumption
        'AllExchangesVolume': '_TSD.csv'
    }
    return features_df, feature_labels, feature_pane_mapping, feature_file_mapping

# ------------------------------------------------------------------
# 5. DYNAMIC FEATURE DATA LOADING - COMPLETELY REWRITTEN
# ------------------------------------------------------------------
def get_feature_data_from_file(symbol, feature_name, file_name, timeframe='1D'):
    """Load feature data from a specific file based on Excel mapping"""
    try:
        folder = os.path.join(BASE_DIR, symbol)
        if not os.path.exists(folder):
            logger.warning(f"Symbol folder not found: {folder}")
            return None

        files = os.listdir(folder)
        logger.info(f"Looking for feature '{feature_name}' in file '{file_name}' for symbol '{symbol}'")

        # Find the exact file or files that match the pattern
        target_files = []
        for file in files:
            if file_name.lower() in file.lower() or file.lower().endswith(file_name.lower()):
                target_files.append(file)

        if not target_files:
            logger.warning(f"No files found matching '{file_name}' in {folder}")
            return None

        # Try to load the feature from the matching files
        df = None
        for file in target_files:
            file_path = os.path.join(folder, file)

            try:
                if file.lower().endswith('.csv'):
                    temp_df = pd.read_csv(file_path)
                    temp_df.columns = temp_df.columns.str.strip()
                    if feature_name in temp_df.columns:
                        df = temp_df
                        logger.info(f"✅ Found feature '{feature_name}' in file '{file}'")
                        break

                elif file.lower().endswith('.rar'):
                    with rarfile.RarFile(file_path, 'r') as rf:
                        for name in rf.namelist():
                            if name.lower().endswith('.csv'):
                                try:
                                    with rf.open(name) as csv_file:
                                        temp_df = pd.read_csv(csv_file)
                                        temp_df.columns = temp_df.columns.str.strip()
                                        if feature_name in temp_df.columns:
                                            df = temp_df
                                            logger.info(f"✅ Found feature '{feature_name}' in '{name}' from RAR '{file}'")
                                            break
                                except Exception as e:
                                    logger.warning(f"Error reading {name} from RAR {file}: {e}")
                                    continue
                        if df is not None:
                            break

            except Exception as e:
                logger.warning(f"Error reading file {file}: {e}")
                continue

        if df is None:
            logger.warning(f"Feature '{feature_name}' not found in any matching files for '{file_name}'")
            return None

        # Process the data
        date_col = find_date_column(df)
        if date_col is None:
            logger.warning("No date column found in data")
            return None

        df[date_col] = parse_datetime_series(df[date_col])
        df.set_index(date_col, inplace=True)

        # Apply time filtering and resampling
        time_cfg = TIME_RANGES.get(timeframe, TIME_RANGES['1D'])
        end_date = df.index.max()
        start_date = end_date - timedelta(days=time_cfg['days'])
        df = df[df.index >= start_date]

        if feature_name not in df.columns:
            return None

        series = df[feature_name].resample(time_cfg['resample']).mean().dropna()

        if len(series) == 0:
            return None

        return {
            'index': [str(x) for x in series.index],
            'values': series.values.tolist()
        }

    except Exception as e:
        logger.error(f"Error getting feature data for {feature_name} from {file_name}: {e}")
        return None

def get_feature_data(symbol, feature_name, timeframe='1D'):
    """Get feature data using Excel mapping - MAIN ENTRY POINT"""
    try:
        # Check if we have a file mapping for this feature
        if feature_name in feature_file_mapping:
            file_name = feature_file_mapping[feature_name]
            logger.info(f"Using Excel mapping: {feature_name} -> {file_name}")
            return get_feature_data_from_file(symbol, feature_name, file_name, timeframe)
        else:
            # Fallback to old method for unmapped features
            logger.warning(f"No file mapping found for feature '{feature_name}', trying fallback search")
            return get_feature_data_fallback(symbol, feature_name, timeframe)

    except Exception as e:
        logger.error(f"Error in get_feature_data for {feature_name}: {e}")
        return None

def get_feature_data_fallback(symbol, feature_name, timeframe='1D'):
    """Fallback method for features not in Excel mapping"""
    try:
        folder = os.path.join(BASE_DIR, symbol)
        if not os.path.exists(folder):
            return None

        files = os.listdir(folder)

        # Try to find the feature in any CSV file (old method)
        df = None
        for file in files:
            if file.lower().endswith('.csv'):
                try:
                    temp_df = pd.read_csv(os.path.join(folder, file))
                    temp_df.columns = temp_df.columns.str.strip()
                    if feature_name in temp_df.columns:
                        df = temp_df
                        break
                except:
                    continue

        if df is None:
            return None

        # Same processing as main method
        date_col = find_date_column(df)
        if date_col is None:
            return None

        df[date_col] = parse_datetime_series(df[date_col])
        df.set_index(date_col, inplace=True)

        time_cfg = TIME_RANGES.get(timeframe, TIME_RANGES['1D'])
        end_date = df.index.max()
        start_date = end_date - timedelta(days=time_cfg['days'])
        df = df[df.index >= start_date]

        if feature_name not in df.columns:
            return None

        series = df[feature_name].resample(time_cfg['resample']).mean().dropna()

        if len(series) == 0:
            return None

        return {
            'index': [str(x) for x in series.index],
            'values': series.values.tolist()
        }

    except Exception as e:
        logger.error(f"Error in fallback method for {feature_name}: {e}")
        return None

# ------------------------------------------------------------------
# 6. SYMBOL AND OHLC FUNCTIONS - UNCHANGED
# ------------------------------------------------------------------
def get_local_symbols():
    """Get symbols from local dataset directory only"""
    try:
        if not os.path.exists(BASE_DIR):
            logger.warning(f"Local dataset directory not found: {BASE_DIR}")
            return []

        symbols = []
        for item in os.listdir(BASE_DIR):
            item_path = os.path.join(BASE_DIR, item)
            if os.path.isdir(item_path):
                files = os.listdir(item_path)
                has_data = any(f.lower().endswith(('.csv', '.rar')) for f in files)
                if has_data:
                    symbols.append(item)

        logger.info(f"Found {len(symbols)} local symbols: {symbols}")
        return sorted(symbols)

    except Exception as e:
        logger.error(f"Error getting local symbols: {e}")
        return []

def get_symbol_ohlc(symbol, timeframe='1D'):
    """Get OHLC data from local dataset - for candlestick charts"""
    try:
        folder = os.path.join(BASE_DIR, symbol)
        if not os.path.exists(folder):
            return None

        files = os.listdir(folder)

        df = None
        # Look for TSD file or any file with OHLC data
        for file in files:
            if file.lower().endswith('_tsd.csv') or file.lower().endswith('.csv'):
                try:
                    temp_df = pd.read_csv(os.path.join(folder, file))
                    temp_df.columns = temp_df.columns.str.strip()

                    ohlc_cols = ['Open', 'High', 'Low', 'Close']
                    if all(col in temp_df.columns for col in ohlc_cols) or 'CurrentPrice' in temp_df.columns:
                        df = temp_df
                        break
                except:
                    continue
            elif file.lower().endswith('.rar'):
                try:
                    with rarfile.RarFile(os.path.join(folder, file), 'r') as rf:
                        for name in rf.namelist():
                            if name.lower().endswith('_tsd.csv') or name.lower().endswith('.csv'):
                                try:
                                    with rf.open(name) as csv_file:
                                        temp_df = pd.read_csv(csv_file)
                                        temp_df.columns = temp_df.columns.str.strip()

                                        ohlc_cols = ['Open', 'High', 'Low', 'Close']
                                        if all(col in temp_df.columns for col in ohlc_cols) or 'CurrentPrice' in temp_df.columns:
                                            df = temp_df
                                            break
                                except:
                                    continue
                        if df is not None:
                            break
                except:
                    continue

        if df is None:
            return None

        # Process OHLC data
        date_col = find_date_column(df)
        if date_col is None:
            return None

        df[date_col] = parse_datetime_series(df[date_col])
        df.set_index(date_col, inplace=True)

        time_cfg = TIME_RANGES.get(timeframe, TIME_RANGES['1D'])
        end_date = df.index.max()
        start_date = end_date - timedelta(days=time_cfg['days'])
        df = df[df.index >= start_date]

        # Create OHLC data
        ohlc_cols = ['Open', 'High', 'Low', 'Close']
        if all(col in df.columns for col in ohlc_cols):
            candles = df[ohlc_cols].resample(time_cfg['resample']).agg({
                'Open': 'first', 'High': 'max', 'Low': 'min', 'Close': 'last'
            })
            candles.columns = ['open', 'high', 'low', 'close']
        else:
            if 'CurrentPrice' not in df.columns:
                return None
            candles = df['CurrentPrice'].resample(time_cfg['resample']).ohlc()
            candles.columns = ['open', 'high', 'low', 'close']

        # Add volume and VWAP if available
        if 'AllExchangesVolume' in df.columns:
            candles['volume'] = df['AllExchangesVolume'].resample(time_cfg['resample']).sum() / 1000

            # Calculate VWAP
            if all(c in df.columns for c in ['High', 'Low', 'Close']):
                typical_price = (df['High'] + df['Low'] + df['Close']) / 3
            else:
                typical_price = df.get('CurrentPrice', candles['close'])

            df['TP_Volume'] = typical_price * df['AllExchangesVolume']
            vwap = df['TP_Volume'].cumsum() / df['AllExchangesVolume'].cumsum()
            candles['vwap'] = vwap.resample(time_cfg['resample']).last()
        else:
            candles['volume'] = np.nan
            candles['vwap'] = np.nan

        candles.dropna(subset=['open', 'high', 'low', 'close'], inplace=True)
        if len(candles) == 0:
            return None

        latest = candles.iloc[-1]

        return {
            'index': [str(x) for x in candles.index],
            'open': candles['open'].tolist(),
            'high': candles['high'].tolist(),
            'low': candles['low'].tolist(),
            'close': candles['close'].tolist(),
            'vwap': candles['vwap'].tolist() if not candles['vwap'].isnull().all() else None,
            'volume': candles['volume'].tolist() if not candles['volume'].isnull().all() else None,
            'latest': {
                'open': float(latest['open']),
                'high': float(latest['high']),
                'low': float(latest['low']),
                'close': float(latest['close']),
                'vwap': float(latest['vwap']) if not pd.isna(latest['vwap']) else None,
                'volume': float(latest['volume']) if not pd.isna(latest['volume']) else 0,
                'change': float(latest['close'] - latest['open']),
                'change_pct': float(((latest['close'] - latest['open']) / latest['open']) * 100) if latest['open'] != 0 else 0
            }
        }

    except Exception as e:
        logger.error(f"Error getting OHLC for {symbol}: {e}")
        return None

# ------------------------------------------------------------------
# 7. API ROUTES - UPDATED FOR DYNAMIC FEATURES
# ------------------------------------------------------------------
@app.route('/api/symbols')
def get_symbols():
    """Get available symbols from local dataset"""
    try:
        symbols = get_local_symbols()
        return jsonify({'symbols': symbols})
    except Exception as e:
        logger.error(f"Error getting symbols: {e}")
        return jsonify({'error': str(e), 'symbols': []})

@app.route('/api/features')
def get_features():
    """Get available chart features from Excel configuration"""
    try:
        if features_df.empty:
            logger.info("Using default features")
            return jsonify({
                'pane1_features': ['CurrentPrice'],
                'pane2_features': ['AllExchangesVolume'],
                'feature_labels': feature_labels,
                'feature_file_mapping': feature_file_mapping
            })

        # Get features by pane from Excel data
        pane1_features = [f for f, p in feature_pane_mapping.items() if p == 1]
        pane2_features = [f for f, p in feature_pane_mapping.items() if p == 2]

        logger.info(f"Returning {len(pane1_features)} pane1 and {len(pane2_features)} pane2 features")

        return jsonify({
            'pane1_features': pane1_features,
            'pane2_features': pane2_features,
            'feature_labels': feature_labels,
            'feature_file_mapping': feature_file_mapping
        })

    except Exception as e:
        logger.error(f"Error getting features: {e}")
        return jsonify({
            'error': str(e),
            'pane1_features': ['CurrentPrice'],
            'pane2_features': ['AllExchangesVolume'],
            'feature_labels': feature_labels
        })

@app.route('/api/chart-data')
def get_chart_data():
    """Get chart data using dynamic Excel-based feature loading"""
    try:
        symbol = request.args.get('symbol', '')
        timeframe = request.args.get('timeframe', '1D')
        pane1_feature = request.args.get('pane1', 'CurrentPrice')
        pane2_feature = request.args.get('pane2', 'AllExchangesVolume')

        if not symbol:
            return jsonify({
                'error': 'No symbol specified',
                'chart_data': None,
                'symbol_info': None
            }), 400

        logger.info(f"Getting chart data for {symbol} {timeframe} pane1:{pane1_feature} pane2:{pane2_feature}")

        # Get OHLC data for candlestick chart
        ohlc_data = get_symbol_ohlc(symbol, timeframe)

        # Get feature data using Excel mapping
        pane1_data = get_feature_data(symbol, pane1_feature, timeframe) if pane1_feature else None
        pane2_data = get_feature_data(symbol, pane2_feature, timeframe) if pane2_feature else None

        # Generate volume colors
        volume_colors = []
        if ohlc_data and pane2_data:
            for i in range(len(pane2_data['values'])):
                if i < len(ohlc_data['close']):
                    bullish = ohlc_data['close'][i] >= ohlc_data['open'][i]
                    volume_colors.append('#10b981' if bullish else '#ef4444')
                else:
                    volume_colors.append('#10b981')

        response_data = {
            'chart_data': {
                'ohlc_data': ohlc_data,
                'pane1_data': pane1_data,
                'pane2_data': pane2_data,
                'volume_colors': volume_colors
            },
            'symbol_info': ohlc_data['latest'] if ohlc_data else None
        }

        # Log success/failure for debugging
        if pane1_data:
            logger.info(f"✅ Successfully loaded pane1 feature: {pane1_feature}")
        else:
            logger.warning(f"❌ Failed to load pane1 feature: {pane1_feature}")

        if pane2_data:
            logger.info(f"✅ Successfully loaded pane2 feature: {pane2_feature}")
        else:
            logger.warning(f"❌ Failed to load pane2 feature: {pane2_feature}")

        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error getting chart data: {e}")
        return jsonify({
            'error': str(e),
            'chart_data': None,
            'symbol_info': None
        }), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    try:
        local_symbols = get_local_symbols()

        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'mode': 'local_dataset_with_excel_mapping',
            'config_loaded': not features_df.empty,
            'base_dir_exists': os.path.exists(BASE_DIR),
            'config_file_exists': os.path.exists(STRATEGY_MATRIX_PATH),
            'features_count': len(features_df),
            'local_symbols_count': len(local_symbols),
            'local_symbols': local_symbols[:5],  # First 5 symbols
            'feature_mappings': len(feature_file_mapping),
            'version': '3.0.0-dynamic'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

# ------------------------------------------------------------------
# 8. INITIALIZE AND START
# ------------------------------------------------------------------
# Load configuration on startup
features_df, feature_labels, feature_pane_mapping, feature_file_mapping = load_configuration()

if __name__ == '__main__':
    print("🚀 Starting TradePro Dashboard Backend - Dynamic Excel Mapping Mode")
    print(f"📊 Features loaded: {len(features_df)}")
    print(f"📁 Local dataset directory: {BASE_DIR}")
    print(f"📋 Config file: {STRATEGY_MATRIX_PATH}")
    print(f"🗂️  Feature-to-file mappings: {len(feature_file_mapping)}")
    print(f"🔧 Mode: DYNAMIC FEATURE LOADING")

    # Test configuration
    if feature_file_mapping:
        print("📋 Feature Mappings:")
        for feature, file in list(feature_file_mapping.items())[:5]:
            print(f"   {feature} -> {file}")
        if len(feature_file_mapping) > 5:
            print(f"   ... and {len(feature_file_mapping) - 5} more")

    # Test local dataset
    local_symbols = get_local_symbols()
    print(f"📈 Local symbols found: {len(local_symbols)}")
    if local_symbols:
        print(f"   Sample symbols: {local_symbols[:3]}")

    print("🌐 Server running on http://127.0.0.1:5000")
    print("📱 Frontend available at http://localhost:3000")

    app.run(debug=True, host='127.0.0.1', port=5000, threaded=True)
