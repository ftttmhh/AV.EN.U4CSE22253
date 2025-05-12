import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Slider, 
  Alert, 
  AlertTitle, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  OutlinedInput,
  Paper
} from '@mui/material';
import CorrelationHeatmap from '../components/CorrelationHeatmap';
import { getStocks, getStockPrice } from '../api';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const HeatmapPage = () => {
  const [availableStocks, setAvailableStocks] = useState({});
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [timeFrame, setTimeFrame] = useState(30);
  const [stocksData, setStocksData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  // Fetch available stocks on component mount
  useEffect(() => {
    const fetchStocks = async () => {
      console.log("Fetching available stocks for heatmap...");
      try {
        const stocks = await getStocks();
        if (stocks && Object.keys(stocks).length > 0) {
          console.log(`Loaded ${Object.keys(stocks).length} stocks successfully`);
          setAvailableStocks(stocks);
          // Pre-select some popular stocks if we have them
          const defaultStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'].filter(ticker => 
            Object.values(stocks).includes(ticker)
          );
          if (defaultStocks.length > 0) {
            setSelectedStocks(defaultStocks);
          }
        } else {
          console.warn("Received empty stocks data");
        }
      } catch (err) {
        console.error('Failed to fetch stocks:', err);
        setError('Could not load available stocks. Using fallback data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStocks();
  }, []);
  
  // Fetch stock data for selected stocks when they change
  useEffect(() => {
    if (selectedStocks.length === 0) {
      setStocksData({});
      return;
    }
    
    const fetchStocksData = async () => {
      console.log(`Fetching data for ${selectedStocks.length} stocks with timeframe ${timeFrame}...`);
      try {
        setLoading(true);
        setError(null);
        
        const stocksDataMap = {};
        const promises = selectedStocks.map(async (ticker) => {
          try {
            console.log(`Fetching heatmap data for ${ticker}...`);
            const data = await getStockPrice(ticker, timeFrame);
            
            // Handle different API response formats
            if (Array.isArray(data)) {
              // Data already in array format
              stocksDataMap[ticker] = data;
              console.log(`Got array data for ${ticker}: ${data.length} points`);
            } else if (data && data.stock) {
              // Single stock data point format
              stocksDataMap[ticker] = [data.stock];
              console.log(`Got single point data for ${ticker}`);
            } else if (data) {
              // Some other format - try to handle gracefully
              console.warn(`Unexpected data format for ${ticker}:`, data);
              // Include whatever we got as a single point if it has a price
              if (data.price) {
                stocksDataMap[ticker] = [data];
              }
            }
          } catch (err) {
            console.error(`Error fetching data for ${ticker}:`, err);
            // Continue with other stocks - don't fail the whole operation
          }
        });
        
        await Promise.all(promises);
        
        if (Object.keys(stocksDataMap).length === 0) {
          console.warn('No stock data retrieved for any selected stocks');
          setError('Could not load data for the selected stocks. Try different stocks or refresh.');
        } else {
          console.log(`Successfully loaded data for ${Object.keys(stocksDataMap).length}/${selectedStocks.length} stocks`);
          setStocksData(stocksDataMap);
          setError(null);
        }
      } catch (err) {
        console.error(`Failed to fetch stock data:`, err);
        setError(`There was a problem loading stock data. Some data may be missing.`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStocksData();
    
    // Set up auto-refresh every 60 seconds
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    const interval = setInterval(fetchStocksData, 60000);
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [selectedStocks, timeFrame]);
  
  const handleTimeFrameChange = (event, newValue) => {
    setTimeFrame(newValue);
  };
  
  const handleStocksChange = (event) => {
    const { value } = event.target;
    setSelectedStocks(typeof value === 'string' ? value.split(',') : value);
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Stock Correlation Heatmap</Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Select stocks and a time frame to visualize their correlation
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="stocks-select-label">Select Stocks</InputLabel>
            <Select
              labelId="stocks-select-label"
              id="stocks-select"
              multiple
              value={selectedStocks}
              onChange={handleStocksChange}
              input={<OutlinedInput id="select-multiple-chips" label="Select Stocks" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {Object.entries(availableStocks).map(([name, ticker]) => (
                <MenuItem key={ticker} value={ticker}>
                  {name} ({ticker})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography id="time-frame-slider" gutterBottom>
            Time Frame (minutes): {timeFrame}
          </Typography>
          <Slider
            aria-labelledby="time-frame-slider"
            value={timeFrame}
            onChange={handleTimeFrameChange}
            valueLabelDisplay="auto"
            step={5}
            marks
            min={5}
            max={60}
          />
        </Box>
      </Paper>
      
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Notice</AlertTitle>
          {error}
        </Alert>
      )}
      
      {loading && Object.keys(stocksData).length === 0 ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : (
        <CorrelationHeatmap stocksData={stocksData} timeFrame={timeFrame} />
      )}
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="textSecondary">
          Note: The heatmap shows the Pearson correlation coefficient between stock pairs.
          Values close to 1 indicate a strong positive correlation, values close to -1 indicate a
          strong negative correlation, and values close to 0 indicate little to no correlation.
        </Typography>
      </Box>
    </Box>
  );
};

export default HeatmapPage;
