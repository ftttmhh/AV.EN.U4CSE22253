import React, { useState } from "react";
import { Box, Tabs, Tab, AppBar, Typography, Container } from "@mui/material";
import StockPage from "./pages/StockPage";
import HeatmapPage from "./pages/HeatmapPage";
import AuthSetup from "./components/AuthSetup";
import "./App.css";

function App() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <div className="App">
      <AppBar position="static" color="primary">
        <Typography variant="h4" sx={{ py: 2, textAlign: 'center' }}>
          Stock Price Aggregator
        </Typography>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          centered
          textColor="inherit"
          indicatorColor="secondary"
        >
          <Tab label="Stock Chart" />
          <Tab label="Correlation Heatmap" />
        </Tabs>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'none' }}>
          <AuthSetup />
        </Box>
        
        {tabValue === 0 && <StockPage />}
        {tabValue === 1 && <HeatmapPage />}
      </Container>
    </div>
  );
}

export default App;
