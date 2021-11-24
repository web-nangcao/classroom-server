const express = require('express');
const path = require('path');
const cors = require('cors')

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// Environment variables
require('dotenv').config()

// Cors
app.use(cors({ origin: true }));

// Mongodb middleware
require('./middlewares/mongodb')(app)

// Body parser midleware
require('./middlewares/bodyParser')(app)

// Cooke parser middlewares
require('./middlewares/cookeParser')

// Passport-auth middleware
require('./middlewares/passport')(app)

// Router middleware
require('./middlewares/router')(app)

// Error handler middleware
require('./middlewares/errorHandler')(app)

module.exports = app;