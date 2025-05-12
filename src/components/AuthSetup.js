import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import { setAccessToken, register, authenticate } from '../api';

const AuthSetup = () => {
  const [token, setToken] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: true, // Default to authenticated since we have a hardcoded token
    message: ''
  });
  
  // Registration and authentication state
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrationData, setRegistrationData] = useState({
    companyName: '',
    ownerName: '',
    rollNo: '',
    ownerEmail: '',
    accessCode: ''
  });
  const [credentials, setCredentials] = useState({
    clientID: '',
    clientSecret: '',
    companyName: ''
  });

  // Load the token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleTokenSubmit = () => {
    if (!token.trim()) {
      setAuthStatus({
        isAuthenticated: false,
        message: 'Please enter a valid token'
      });
      return;
    }

    // Set the token for API calls
    setAccessToken(token);
    
    setAuthStatus({
      isAuthenticated: true,
      message: 'Authentication token set successfully'
    });
    
    setShowDialog(false);
  };

  const handleOpenDialog = () => {
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };
  
  // Handle registration form changes
  const handleRegistrationInputChange = (e) => {
    const { name, value } = e.target;
    setRegistrationData({
      ...registrationData,
      [name]: value
    });
  };
  
  // Handle credentials form changes
  const handleCredentialsInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
  };
  
  // Handle registration
  const handleRegister = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await register(registrationData);
      
      // Update credentials with the response
      setCredentials({
        clientID: result.clientID,
        clientSecret: result.clientSecret,
        companyName: registrationData.companyName
      });
      
      setLoading(false);
      setActiveStep(1); // Move to next step
    } catch (err) {
      setError('Registration failed: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };
  
  // Handle authentication
  const handleAuthenticate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await authenticate(credentials);
      
      // Set token and update status
      setToken(token);
      setAuthStatus({
        isAuthenticated: true,
        message: 'Authentication successful'
      });
      
      setLoading(false);
      setShowDialog(false);
    } catch (err) {
      setError('Authentication failed: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };
  
  // Steps in the auth process
  const steps = ['Register', 'Authenticate'];

  return (
    <Box>
      {/* Display optional button to change token if needed */}
      <Button 
        variant="outlined" 
        size="small" 
        onClick={handleOpenDialog}
        sx={{ mb: 2, display: 'none' }} // Hide this button by default 
      >
        Update API Token
      </Button>

      {/* Authentication Dialog */}
      <Dialog 
        open={showDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          API Authentication
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your API access token directly or complete the registration and authentication process.
          </Typography>
          
          {/* Direct token input */}
          <TextField
            margin="dense"
            id="token"
            label="Access Token"
            type="text"
            fullWidth
            variant="outlined"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Button 
            onClick={handleTokenSubmit} 
            variant="contained" 
            color="primary"
            fullWidth
            sx={{ mb: 3 }}
          >
            Set Token
          </Button>
          
          <Typography variant="body2" sx={{ mb: 2, mt: 3, textAlign: 'center' }}>
            --- OR ---
          </Typography>
          
          {/* Registration and authentication steps */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            
            {activeStep === 0 ? (
              // Registration form
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Register for API access
                </Typography>
                
                <TextField
                  margin="dense"
                  name="companyName"
                  label="Company Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={registrationData.companyName}
                  onChange={handleRegistrationInputChange}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  margin="dense"
                  name="ownerName"
                  label="Owner Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={registrationData.ownerName}
                  onChange={handleRegistrationInputChange}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  margin="dense"
                  name="rollNo"
                  label="Roll Number"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={registrationData.rollNo}
                  onChange={handleRegistrationInputChange}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  margin="dense"
                  name="ownerEmail"
                  label="Email"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={registrationData.ownerEmail}
                  onChange={handleRegistrationInputChange}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  margin="dense"
                  name="accessCode"
                  label="Access Code"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={registrationData.accessCode}
                  onChange={handleRegistrationInputChange}
                  sx={{ mb: 2 }}
                />
                
                <Button
                  onClick={handleRegister}
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Register'}
                </Button>
              </Box>
            ) : (
              // Authentication form
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Authenticate with your credentials
                </Typography>
                
                <TextField
                  margin="dense"
                  name="companyName"
                  label="Company Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={credentials.companyName}
                  onChange={handleCredentialsInputChange}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  margin="dense"
                  name="clientID"
                  label="Client ID"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={credentials.clientID}
                  onChange={handleCredentialsInputChange}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  margin="dense"
                  name="clientSecret"
                  label="Client Secret"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={credentials.clientSecret}
                  onChange={handleCredentialsInputChange}
                  sx={{ mb: 2 }}
                />
                
                <Button
                  onClick={handleAuthenticate}
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Authenticate'}
                </Button>
                
                <Button
                  onClick={() => setActiveStep(0)}
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Back to Registration
                </Button>
              </Box>
            )}
          </Paper>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuthSetup; 