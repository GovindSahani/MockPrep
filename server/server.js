const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const questionRoutes = require('./routes/questionRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const resultRoutes = require('./routes/resultRoutes');
const resumeRoutes = require('./routes/resumeRoutes');

dotenv.config();

const app = express();

// Middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/resume', resumeRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Serve the client build folder
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

  // SPA catch-all: any route not matched by API goes to index.html
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

// Error Handling (Basic)
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // Only connect if MONGO_URI is set, else warn and run without DB for now (helps testing before DB is ready)
    if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('<username>')) {
        await connectDB();
    } else {
        console.warn('MongoDB URI not configured properly. Running without DB connection.');
    }
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
};

startServer();
