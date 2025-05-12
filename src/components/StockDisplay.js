import React from 'react';
import { Box, Paper, Typography, Grid, Divider, Chip } from '@mui/material';
import { calculateAverage, calculateStdDev } from '../api';

/**
 * Component to display detailed stock information
 */
const StockDisplay = ({ stockData, stockName }) => {
  // Process data to ensure it's in array format
  let dataArray = [];
  
  if (Array.isArray(stockData)) {
    dataArray = stockData;
  } else if (stockData && stockData.stock) {
    // Single data point from API - format {"stock":{"price":960.57416,"lastUpdatedAt":"..."}}
    dataArray = [stockData.stock];
  }
  
  if (!dataArray || dataArray.length === 0) {
    return null;
  }
  
  // Calculate statistics
  const avgPrice = calculateAverage(dataArray);
  const stdDev = calculateStdDev(dataArray);
  
  // Find min and max prices
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let minTimestamp = '';
  let maxTimestamp = '';
  
  dataArray.forEach(item => {
    if (item.price < minPrice) {
      minPrice = item.price;
      minTimestamp = item.lastUpdatedAt;
    }
    if (item.price > maxPrice) {
      maxPrice = item.price;
      maxTimestamp = item.lastUpdatedAt;
    }
  });
  
  // For a single data point, we can't calculate meaningful changes
  if (dataArray.length === 1) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Stock Details</Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Current Price</Typography>
              <Typography variant="h6">${dataArray[0].price.toFixed(2)}</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">Last Updated</Typography>
              <Typography variant="body1">
                {new Date(dataArray[0].lastUpdatedAt).toLocaleString()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  }
  
  // Calculate price change for multiple data points
  const sortedData = [...dataArray].sort((a, b) => 
    new Date(a.lastUpdatedAt) - new Date(b.lastUpdatedAt)
  );
  
  const firstPrice = sortedData[0]?.price || 0;
  const lastPrice = sortedData[sortedData.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const percentChange = firstPrice !== 0 ? (priceChange / firstPrice) * 100 : 0;
  
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>Stock Statistics</Typography>
      
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Average Price</Typography>
            <Typography variant="h6">${avgPrice.toFixed(2)}</Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Standard Deviation</Typography>
            <Typography variant="h6">${stdDev.toFixed(2)}</Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Price Change</Typography>
            <Box display="flex" alignItems="center">
              <Typography variant="h6">${priceChange.toFixed(2)}</Typography>
              <Chip 
                label={`${percentChange.toFixed(2)}%`} 
                color={percentChange >= 0 ? "success" : "error"} 
                size="small"
                sx={{ ml: 1 }}
              />
            </Box>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">Data Points</Typography>
            <Typography variant="h6">{dataArray.length}</Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Box>
            <Typography variant="subtitle2" color="textSecondary">Lowest Price</Typography>
            <Typography variant="body1">${minPrice.toFixed(2)}</Typography>
            <Typography variant="caption" color="textSecondary">
              {new Date(minTimestamp).toLocaleString()}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Box>
            <Typography variant="subtitle2" color="textSecondary">Highest Price</Typography>
            <Typography variant="body1">${maxPrice.toFixed(2)}</Typography>
            <Typography variant="caption" color="textSecondary">
              {new Date(maxTimestamp).toLocaleString()}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StockDisplay;
