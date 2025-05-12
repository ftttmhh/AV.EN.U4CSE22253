import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { calculateCorrelation, calculateAverage, calculateStdDev } from '../api';

const CorrelationHeatmap = ({ stocksData, timeFrame }) => {
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const canvasRef = useRef(null);
  
  // Calculate correlation matrix when stocksData changes
  useEffect(() => {
    if (!stocksData || Object.keys(stocksData).length === 0) {
      setLoading(false);
      return;
    }
    
    calculateHeatmapData(stocksData);
  }, [stocksData]);
  
  // Initialize canvas when component mounts
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Redraw if we have data
      if (heatmapData) {
        drawHeatmap();
      }
    };
    
    // Initial sizing
    resizeCanvas();
    
    // Setup resize listener
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  const calculateHeatmapData = (data) => {
    setLoading(true);
    
    const stockSymbols = Object.keys(data);
    const correlationMatrix = [];
    const stockStats = {};
    
    // Calculate correlation coefficients between all stock pairs
    stockSymbols.forEach((stockA, indexA) => {
      const row = [];
      
      // Calculate and store statistics for each stock
      stockStats[stockA] = {
        avg: calculateAverage(data[stockA]),
        stdDev: calculateStdDev(data[stockA])
      };
      
      stockSymbols.forEach((stockB, indexB) => {
        // Self-correlation is always 1
        if (indexA === indexB) {
          row.push(1);
        } else {
          const correlation = calculateCorrelation(data[stockA], data[stockB]);
          row.push(correlation);
        }
      });
      
      correlationMatrix.push(row);
    });
    
    setHeatmapData({
      symbols: stockSymbols,
      matrix: correlationMatrix,
      stats: stockStats
    });
    
    setLoading(false);
  };
  
  // Draw the heatmap on the canvas
  const drawHeatmap = () => {
    if (!heatmapData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const numStocks = heatmapData.symbols.length;
    const padding = 80; // Space for labels
    
    // Calculate cell size based on available space
    const maxWidth = canvas.width - (padding * 2);
    const maxHeight = canvas.height - (padding * 2);
    const cellSize = Math.min(
      Math.floor(maxWidth / numStocks),
      Math.floor(maxHeight / numStocks),
      50 // Cap the maximum size
    );
    
    // Draw heatmap cells
    for (let i = 0; i < numStocks; i++) {
      for (let j = 0; j < numStocks; j++) {
        const value = heatmapData.matrix[i][j];
        const x = padding + j * cellSize;
        const y = padding + i * cellSize;
        
        // Calculate color based on correlation value
        const r = value < 0 ? 255 : Math.floor(255 * (1 - value));
        const g = value > 0 ? 255 : Math.floor(255 * (1 + value));
        const b = 0;
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.fillRect(x, y, cellSize, cellSize);
        
        // Add correlation value text if cell is large enough
        if (cellSize >= 25) {
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(value.toFixed(2), x + cellSize / 2, y + cellSize / 2);
        }
      }
    }
    
    // Draw column labels (top)
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < numStocks; i++) {
      const x = padding + i * cellSize + cellSize / 2;
      const y = padding - 20;
      ctx.fillText(heatmapData.symbols[i], x, y);
    }
    
    // Draw row labels (left)
    ctx.textAlign = 'right';
    for (let i = 0; i < numStocks; i++) {
      const x = padding - 10;
      const y = padding + i * cellSize + cellSize / 2;
      ctx.fillText(heatmapData.symbols[i], x, y);
    }
    
    // Draw color scale legend
    const legendWidth = Math.min(200, canvas.width / 3);
    const legendHeight = 20;
    const legendX = canvas.width - legendWidth - 20;
    const legendY = 20;
    
    const gradient = ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)'); // Negative correlation: red
    gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.8)'); // Zero correlation: yellow
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0.8)'); // Positive correlation: green
    
    ctx.fillStyle = gradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    
    // Draw legend ticks
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    ctx.fillText('-1', legendX, legendY + legendHeight + 5);
    ctx.fillText('0', legendX + legendWidth / 2, legendY + legendHeight + 5);
    ctx.fillText('1', legendX + legendWidth, legendY + legendHeight + 5);
    
    ctx.fillText('Correlation Strength', legendX + legendWidth / 2, legendY - 15);
    
    // Title
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Stock Correlation Heatmap (Last ${timeFrame} minutes)`, canvas.width / 2, 20);
  };
  
  // Draw heatmap when data changes
  useEffect(() => {
    if (heatmapData) {
      drawHeatmap();
      setupTooltipHandlers();
    }
  }, [heatmapData, timeFrame]);
  
  // Setup tooltip handlers
  const setupTooltipHandlers = () => {
    if (!canvasRef.current || !heatmapData) return;
    
    const canvas = canvasRef.current;
    const numStocks = heatmapData.symbols.length;
    const padding = 80;
    
    // Calculate cell size based on available space
    const maxWidth = canvas.width - (padding * 2);
    const maxHeight = canvas.height - (padding * 2);
    const cellSize = Math.min(
      Math.floor(maxWidth / numStocks),
      Math.floor(maxHeight / numStocks),
      50
    );
    
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Check if mouse is over a cell
      if (mouseX >= padding && mouseY >= padding) {
        const col = Math.floor((mouseX - padding) / cellSize);
        const row = Math.floor((mouseY - padding) / cellSize);
        
        if (col < numStocks && row < numStocks) {
          const stockSymbol = heatmapData.symbols[row];
          const stats = heatmapData.stats[stockSymbol];
          
          setTooltipInfo({
            x: event.clientX,
            y: event.clientY,
            stock: stockSymbol,
            avg: stats.avg,
            stdDev: stats.stdDev
          });
          return;
        }
      }
      
      setTooltipInfo(null);
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  };
  
  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 2, height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }
  
  if (!heatmapData || Object.keys(heatmapData).length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 2, height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1">Please select stocks to view correlation heatmap</Typography>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2, position: 'relative' }}>
      <Box sx={{ height: '600px', width: '100%', position: 'relative' }}>
        <canvas 
          ref={canvasRef} 
          style={{ width: '100%', height: '100%' }}
        />
        
        {tooltipInfo && (
          <div
            style={{
              position: 'absolute',
              left: tooltipInfo.x + 10,
              top: tooltipInfo.y + 10,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '8px',
              borderRadius: '4px',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <Typography variant="subtitle2">{tooltipInfo.stock}</Typography>
            <Typography variant="body2">Average: ${tooltipInfo.avg.toFixed(2)}</Typography>
            <Typography variant="body2">Std Dev: ${tooltipInfo.stdDev.toFixed(2)}</Typography>
          </div>
        )}
      </Box>
    </Paper>
  );
};

export default CorrelationHeatmap;
