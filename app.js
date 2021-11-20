const express = require('express');
const path = require('path');
const cors = require('cors')

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

// Environment variables
require('dotenv').config()

// Cors
app.use(cors())

// Mongodb middleware
require('./middlewares/mongodb')(app)

// Body parser middleware
require('./middlewares/bodyParser')(app)

// Passport-auth middleware
require('./middlewares/passport')(app)

// View middleware
require('./middlewares/view')(app)

// Router middleware
require('./middlewares/router')(app)

// Error handler middleware
require('./middlewares/errorHandler')(app)

module.exports = app;