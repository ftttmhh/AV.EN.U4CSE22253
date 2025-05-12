import React, { useState, useEffect } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress,
  Stack,
  Slider
} from '@mui/material';
import { getStocks } from '../api';

/**
 * Component for searching and selecting stocks
 */
const StockSearch = ({ onStockSelect, onTimeFrameChange, selectedStock, timeFrame }) => {
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch stocks on component mount
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const stocksData = await getStocks();
        setStocks(stocksData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch stocks. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchStocks();
  }, []);
  
  // Time frame selection
  const handleTimeChange = (event, newValue) => {
    onTimeFrameChange(newValue);
  };
  
  // Stock selection
  const handleStockChange = (event) => {
    onStockSelect(event.target.value);
  };
  
  if (loading) {
    return <Box display="flex" justifyContent="center" my={3}><CircularProgress /></Box>;
  }
  
  if (error) {
    return <Typography color="error" align="center" my={3}>{error}</Typography>;
  }
  
  return (
    <Box sx={{ mb: 4 }}>
      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel id="stock-select-label">Select Stock</InputLabel>
          <Select
            labelId="stock-select-label"
            id="stock-select"
            value={selectedStock || ''}
            onChange={handleStockChange}
            label="Select Stock"
          >
            {Object.entries(stocks).map(([name, ticker]) => (
              <MenuItem key={ticker} value={ticker}>
                {name} ({ticker})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box>
          <Typography id="time-frame-slider" gutterBottom>
            Time Frame (minutes): {timeFrame}
          </Typography>
          <Slider
            aria-labelledby="time-frame-slider"
            value={timeFrame}
            onChange={handleTimeChange}
            valueLabelDisplay="auto"
            step={5}
            marks
            min={5}
            max={60}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default StockSearch;
