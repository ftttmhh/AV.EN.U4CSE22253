import axios from 'axios';

const BASE_URL = 'http://20.244.56.144/evaluation-service';

// Store a default token
const DEFAULT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ3MDYwNzQzLCJpYXQiOjE3NDcwNjA0NDMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjdhMWMyMDAwLTU2ZTktNDY1MS1iOGQzLWQxMzg2YTZmZGNkZSIsInN1YiI6ImZ0dHRtaGgyNTNAZ21haWwuY29tIn0sImVtYWlsIjoiZnR0dG1oaDI1M0BnbWFpbC5jb20iLCJuYW1lIjoiZmlyZG91cyBmYXRpbWFoIiwicm9sbE5vIjoiYXYuZW4udTRjc2UyMjI1MyIsImFjY2Vzc0NvZGUiOiJTd3V1S0UiLCJjbGllbnRJRCI6IjdhMWMyMDAwLTU2ZTktNDY1MS1iOGQzLWQxMzg2YTZmZGNkZSIsImNsaWVudFNlY3JldCI6Ilpwa01xRndqdW1DZXV1WGQifQ.bwSK_R-p96vq99Rq-1XSmVRmZKN9ApGa0oOgZnR_eOY";

// Store the token after authentication - use default if none in localStorage
let accessToken = localStorage.getItem('accessToken') || DEFAULT_TOKEN;

// Initialize localStorage with the default token if empty
if (!localStorage.getItem('accessToken')) {
  localStorage.setItem('accessToken', DEFAULT_TOKEN);
}

// Configure axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.timeout = 30000; // 30 seconds timeout
axios.defaults.headers.common['Accept'] = '*/*';

// Create a custom axios instance with proper headers
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Access-Control-Allow-Origin': '*',
    'Authorization': `Bearer ${accessToken}`
  },
  timeout: 30000
});

// Log request for debugging
const logRequest = (config) => {
  console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
  console.log(`Request headers:`, config.headers);
  return config;
};

// Add request interceptor for adding authentication
api.interceptors.request.use(
  config => {
    // Make sure the token has the Bearer prefix
    config.headers['Authorization'] = `Bearer ${accessToken}`;
    return logRequest(config);
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`API Success: ${response.config.url}`);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`API Error ${error.response.status}: ${error.response.config.url}`);
      console.error(`Response:`, error.response.data);
    } else if (error.request) {
      console.error('API Error: No response received');
      console.error('Request details:', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Mock stock data for fallback
const MOCK_STOCKS = {
  "Apple Inc.": "AAPL",
  "Microsoft Corporation": "MSFT",
  "Alphabet Inc.": "GOOGL",
  "Amazon.com, Inc.": "AMZN",
  "Tesla, Inc.": "TSLA",
  "Meta Platforms, Inc.": "META",
  "NVIDIA Corporation": "NVDA"
};

/**
 * Register with the API to get client credentials
 * @param {Object} registrationData - Registration data including companyName, ownerName, etc.
 * @returns {Promise<Object>} Object with clientID and clientSecret
 */
export const register = async (registrationData) => {
  try {
    const response = await api.post(`/register`, registrationData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Authenticate with the API to get an access token
 * @param {Object} authData - Authentication data including clientID and clientSecret
 * @returns {Promise<string>} Access token
 */
export const authenticate = async (authData) => {
  try {
    const response = await api.post(`/auth`, authData);
    const token = response.data.access_token;
    
    // Store token for future requests
    accessToken = token;
    localStorage.setItem('accessToken', token);
    
    return token;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

/**
 * Set a token directly (e.g., from user input)
 * @param {string} token - The access token to use
 */
export const setAccessToken = (token) => {
  accessToken = token;
  localStorage.setItem('accessToken', token);
};

/**
 * Fetches the list of all available stocks
 * @returns {Promise<Object>} Object with stock names as keys and tickers as values
 */
export const getStocks = async () => {
  try {
    console.log("Fetching stocks from API...");
    const response = await api.get(`/stocks`);
    console.log("Got stocks response:", response.data);
    return response.data.stocks;
  } catch (error) {
    console.error("Error fetching stocks:", error);
    console.log("Using mock stock data as fallback");
    return MOCK_STOCKS; // Return mock data on error
  }
};

/**
 * Fetches price data for a specific stock
 * @param {string} ticker - The stock ticker symbol
 * @param {number} [minutes=null] - Optional time frame in minutes
 * @returns {Promise<Array|Object>} Price data for the stock
 */
export const getStockPrice = async (ticker, minutes = null) => {
  try {
    let url = `/stocks/${ticker}`;
    if (minutes) {
      url += `?minutes=${minutes}`;
    }
    
    console.log(`Fetching stock price for ${ticker}:`, url);
    const response = await api.get(url);
    console.log(`Stock data response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching stock price for ${ticker}:`, error);
    
    // Return mock data as fallback
    return {
      stock: {
        price: Math.floor(Math.random() * 1000) + 100,
        lastUpdatedAt: new Date().toISOString()
      }
    };
  }
};

/**
 * Processes price data to ensure it's in a consistent array format
 * @param {Array|Object} data - Raw data from the API
 * @returns {Array} Array of price objects
 */
export const normalizeStockData = (data) => {
  if (!data) return [];
  
  if (Array.isArray(data)) {
    return data;
  } else if (data.stock) {
    return [data.stock];
  }
  
  return [];
};

/**
 * Calculate correlation between two stock price arrays
 * @param {Array} pricesA - Array of price objects for stock A
 * @param {Array} pricesB - Array of price objects for stock B
 * @returns {number} Correlation coefficient between -1 and 1
 */
export const calculateCorrelation = (pricesA, pricesB) => {
  if (!pricesA || !pricesB || !pricesA.length || !pricesB.length) return 0;
  
  // Extract price values only
  const valuesA = pricesA.map(item => item.price);
  const valuesB = pricesB.map(item => item.price);
  
  // Calculate means
  const meanA = valuesA.reduce((sum, val) => sum + val, 0) / valuesA.length;
  const meanB = valuesB.reduce((sum, val) => sum + val, 0) / valuesB.length;
  
  // Calculate covariance and standard deviations
  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;
  
  // Use the smaller array length to avoid indexing errors
  const minLength = Math.min(valuesA.length, valuesB.length);
  
  for (let i = 0; i < minLength; i++) {
    const diffA = valuesA[i] - meanA;
    const diffB = valuesB[i] - meanB;
    
    covariance += diffA * diffB;
    varianceA += diffA * diffA;
    varianceB += diffB * diffB;
  }
  
  // Avoid division by zero for small datasets
  if (minLength <= 1) return 0;
  
  covariance /= minLength - 1;
  varianceA /= minLength - 1;
  varianceB /= minLength - 1;
  
  const stdDevA = Math.sqrt(varianceA);
  const stdDevB = Math.sqrt(varianceB);
  
  // Pearson correlation coefficient
  if (stdDevA === 0 || stdDevB === 0) return 0;
  return covariance / (stdDevA * stdDevB);
};

/**
 * Calculate the average price from an array of price data
 * @param {Array} prices - Array of price objects
 * @returns {number} Average price
 */
export const calculateAverage = (prices) => {
  if (!prices || prices.length === 0) return 0;
  return prices.reduce((sum, item) => sum + item.price, 0) / prices.length;
};

/**
 * Calculate the standard deviation of prices
 * @param {Array} prices - Array of price objects
 * @returns {number} Standard deviation of prices
 */
export const calculateStdDev = (prices) => {
  if (!prices || prices.length <= 1) return 0;
  
  const avg = calculateAverage(prices);
  const variance = prices.reduce((sum, item) => {
    return sum + Math.pow(item.price - avg, 2);
  }, 0) / (prices.length - 1);
  
  return Math.sqrt(variance);
};
