# trading-portfolio-api
A real-time trading portfolio tracker

# Stock Portfolio Management System

A real-time stock portfolio tracking application built with Node.js, Express, Socket.IO, and MongoDB. Features live price updates, portfolio analytics, and WebSocket-based real-time communication.

[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)](#)
[![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](#)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=white)](#)

## Key Features

- **Real-time Portfolio Tracking**: Live stock price updates and portfolio value calculations
- **User Authentication**: JWT-based authentication system
- **WebSocket Integration**: Real-time portfolio updates pushed to connected clients
- **Financial Analytics**: Profit/loss calculations, percentage tracking, and portfolio metrics
- **API Integration**: Alpha Vantage stock data with intelligent caching (60-second cache)
- **Security Features**: Rate limiting, input validation, and error handling

## Tech Stack

**Backend**: Node.js, Express.js  
**Database**: MongoDB with Mongoose  
**Real-time**: Socket.IO for WebSocket communication  
**Authentication**: JWT tokens  
**External API**: Alpha Vantage for stock market data  
**Security**: Helmet, CORS, rate-limiter-flexible

## Installation & Setup

### Prerequisites
Node.js (v14 or higher)
MongoDB instance (local or cloud)
Alpha Vantage API key (required for stock data) - Get free key at Alpha Vantage

### Setup Steps
```bash
git clone https://github.com/Abdulbaasiterinkitola/trading-portfolio-api.git
cd trading-portfolio-api
npm install

# Create environment file with your configuration
# See Environment Configuration section below

npm start  # or node app.js
```

The application serves static files from the `public` directory and runs on the configured PORT.

## Environment Configuration

Create a `.env` file or set these environment variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/portfolio-db
JWT_SECRET=your-secure-secret-key
ALPHA_VANTAGE_API_KEY=your-api-key
NODE_ENV=development
```

## API Endpoints

### Authentication Routes (`/api/auth`)
```
POST /api/auth/register - Register new user
POST /api/auth/login    - User login
```

### Portfolio Routes (`/api/portfolio`) - All require authentication
```
GET    /api/portfolio/live        - Get live portfolio data with current prices
POST   /api/portfolio/stock       - Add stock to portfolio
DELETE /api/portfolio/stock/:symbol - Remove stock from portfolio
```

### Stock Data Routes (`/api/stocks`)
```
GET /api/stocks/:symbol/price - Get current stock price
GET /api/stocks/:symbol/info  - Get stock company information
```

### Test Route
```
GET /api/test - Simple API test endpoint
```

## Example API Usage

### Adding a Stock Position
```javascript
POST /api/portfolio/stock
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "symbol": "AAPL",
  "quantity": 10
}
```

**Response includes updated portfolio:**
```javascript
{
  "success": true,
  "message": "Stock added to portfolio",
  "stock": {
    "userId": "...",
    "symbol": "AAPL", 
    "quantity": 10,
    "purchasePrice": 155.30
  },
  "portfolio": {
    "totalValue": 1553.00,
    "totalInvested": 1553.00,
    "profitLoss": 0,
    "profitLossPercent": 0,
    "stockCount": 1,
    "positions": [...],
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

### Getting Live Portfolio
```javascript
GET /api/portfolio/live
Authorization: Bearer <jwt-token>
```

Returns real-time portfolio data with current stock prices and calculated metrics.

## WebSocket Integration

### Server-side WebSocket Events

**Authentication**: Clients must provide JWT token via `socket.handshake.auth.token` or Authorization header.

**Client Events (sent to server):**
- `subscribe_to_stock(symbol)` - Subscribe to stock price updates
- `unsubscribe_from_stock(symbol)` - Unsubscribe from stock updates  
- `request_portfolio_update()` - Request immediate portfolio refresh

**Server Events (sent to client):**
- `portfolioUpdate(data)` - Real-time portfolio metrics update
- `error(message)` - Error notifications

### Client Connection Example
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('portfolioUpdate', (data) => {
  console.log('Portfolio updated:', data);
});

socket.emit('subscribe_to_stock', 'AAPL');
```

## Key Implementation Details

### Stock Price Management
- **Caching**: 60-second cache for stock prices to minimize API calls
- **Error Handling**: Falls back to cached prices when API fails or hits rate limits
- **Batch Updates**: Portfolio updates sent every 10 minutes (initially 5 seconds⚡, but restrained by AlphaVantage's free-tier limits) to all connected users

### Portfolio Calculations
When adding stocks:
- If stock already exists: Calculates weighted average purchase price
- New positions: Uses current market price as purchase price
- Real-time metrics: Calculates current value, P&L, and percentage changes

### Authentication Flow
- JWT tokens generated on login
- WebSocket connections authenticated via token
- Users join personal rooms for targeted updates (`user_${userId}`)

### Rate Limiting
- 100 requests per minute per IP address
- Returns 429 status when limit exceeded

## Database Schema

### Portfolio Model
```javascript
{
  userId: ObjectId (required, ref: 'User'),
  symbol: String (required, uppercase, trimmed),
  quantity: Number (required, min: 1),
  purchasePrice: Number (required, min: 0),
  purchaseDate: Date (default: now),
  timestamps: true
}
```

**Index**: `{ userId: 1, symbol: 1 }` for efficient queries

### User Model  
```javascript
{
  username: String (required, unique),
  email: String (required, unique), 
  password: String (required, hashed),
  timestamps: true
}
```

## Architecture

### File Structure
```
- src/
  - config/          # Database and environment config
  - controllers/     # Route handlers
  - middlewares/     # Authentication middleware
  - models/          # Mongoose schemas
  - routes/          # Express routes  
  - services/        # Business logic
  - utils/           # Utilities (logger)
- public/            # Static frontend files
- app.js            # Main server file
```

### Key Components
- **Live Updates Service**: Runs every 10 minutes, calculates portfolio metrics for all users
- **Stock Service**: Handles Alpha Vantage API integration with caching
- **Portfolio Controller**: Manages add/remove stock operations
- **WebSocket Authentication**: Custom middleware for Socket.IO JWT validation

## Error Handling

- Comprehensive try-catch blocks in all controllers
- Structured logging with custom logger utility
- Graceful API failure handling with cached data fallback
- User-friendly error messages returned to clients

## Security Features

- **JWT Authentication**: Stateless token-based auth
- **Rate Limiting**: 100 requests/minute per IP via rate-limiter-flexible
- **Security Headers**: Helmet middleware for security headers
- **CORS**: Cross-origin resource sharing configured
- **Input Validation**: Mongoose schema validation and custom checks

## Starting the Application

The server:
1. Connects to MongoDB database
2. Sets up Express middleware and routes  
3. Creates HTTP server with Socket.IO
4. Starts listening on configured PORT
5. Begins live portfolio update service (10-minute intervals)

```bash
node app.js
# or
npm start
```

Visit `http://localhost:3000` to access the frontend (served from `public` directory).

## Contributing

1. Fork the repository
2. Create a feature branch  
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
