require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { corsOrigin } = require('./config/cors');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error-handler');

const app = express();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
