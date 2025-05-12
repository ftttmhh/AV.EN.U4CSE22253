import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Grid, Alert, AlertTitle } from '@mui/material';
import StockSearch from '../components/StockSearch';
import StockChart from '../components/StockChart';
import StockDisplay from '../components/StockDisplay';
import { getStocks, getStockPrice } from '../api';

const StockPage = () => {
  const [selectedStock, setSelectedStock] = useState('');
  const [timeFrame, setTimeFrame] = useState(30); // Default to 30 minutes
  const [stockData, setStockData] = useState(null);
  const [stockName, setStockName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [stocksMap, setStocksMap] = useState({});
  
  // Fetch all stocks for name mapping
  useEffect(() => {
    const fetchAllStocks = async () => {
      try {
        console.log("Fetching all stocks for mapping...");
        const stocks = await getStocks();
        if (stocks) {
          console.log("Stocks loaded successfully:", Object.keys(stocks).length);
          setStocksMap(stocks);
        } else {
          console.error("No stocks data returned");
        }
      } catch (err) {
        console.error("Error fetching stocks map:", err);
        // Continue with empty stocks map
      }
    };
    
    fetchAllStocks();
  }, []);
  
  // Fetch stock data when stock or time frame changes
  useEffect(() => {
    if (!selectedStock) return;
    
    // Find stock name from the map
    const foundStockName = Object.entries(stocksMap).find(
      ([name, ticker]) => ticker === selectedStock
    );
    if (foundStockName) {
      setStockName(foundStockName[0]);
    } else {
      // If we can't find the name, just use the ticker as name
      setStockName(selectedStock);
    }
    
    const fetchStockData = async () => {
      console.log(`Fetching data for ${selectedStock} with timeframe ${timeFrame}...`);
      setLoading(true);
      setError(null);
      
      try {
        // Call the API function that already has fallback mechanism
        const data = await getStockPrice(selectedStock, timeFrame);
        
        if (data) {
          console.log(`Received data for ${selectedStock}:`, data);
          setStockData(data);
          setError(null);
        } else {
          console.error(`Empty data received for ${selectedStock}`);
          setError(`No data available for ${selectedStock}`);
        }
      } catch (err) {
        console.error(`Error fetching ${selectedStock}:`, err);
        setError(`Failed to fetch data for ${selectedStock}. Using backup data.`);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchStockData();
    
    // Set up auto-refresh every 30 seconds
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    const interval = setInterval(fetchStockData, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [selectedStock, timeFrame, stocksMap]);
  
  const handleStockSelect = (ticker) => {
    setSelectedStock(ticker);
  };
  
  const handleTimeFrameChange = (newTimeFrame) => {
    setTimeFrame(newTimeFrame);
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Stock Price Chart</Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Select a stock and time frame to view its price chart
      </Typography>
      
      <StockSearch 
        onStockSelect={handleStockSelect} 
        onTimeFrameChange={handleTimeFrameChange}
        selectedStock={selectedStock}
        timeFrame={timeFrame}
      />
      
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Notice</AlertTitle>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <StockChart stockData={stockData} stockName={stockName} />
          </Grid>
          
          <Grid item xs={12}>
            <StockDisplay stockData={stockData} stockName={stockName} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default StockPage;
