# Harshitha Enterprises Backend

## Project Overview

This repository contains the backend for Harshitha Enterprises, built with Node.js, Express, and MongoDB. It provides authentication, product management, cart handling, order creation, and Cashfree payment integration as REST APIs.

## Architecture

- `server.js` - main Express application entrypoint
- `router/` - defines route handlers for authentication, products, cart, orders, and payments
- `controller/` - contains business logic for each route
- `model/` - Mongoose schemas for `user`, `product`, `order`, and `payment`
- `middleware/` - authentication and authorization middleware
- `.env` - expected environment variables for database, JWT, CORS, and Cashfree settings

## Key Features

- User registration and login with JWT authentication
- Protected endpoints using `authmiddleware`
- Role-based admin access for creating products
- Product listing and retrieval
- User cart management: add, update, delete, clear items
- Order creation and retrieval
- Cashfree payment order creation and verification
- Security: `helmet`, `cors`, and rate limiting for sensitive routes

## Dependencies

The project currently uses these packages in code even though `package.json` is minimal:

- `express`
- `mongoose`
- `dotenv`
- `helmet`
- `express-rate-limit`
- `cors`
- `bcrypt`
- `jsonwebtoken`
- `express-async-handler`
- `node-fetch`

## Setup Instructions

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install express mongoose dotenv helmet express-rate-limit cors bcrypt jsonwebtoken express-async-handler node-fetch
   ```
3. Create a `.env` file in the project root with the required variables.
4. Start the server:
   ```bash
   npm start
   ```

## Expected Environment Variables

The app expects the following environment variables:

- `PORT` - port for the Express server
- `JWT_SECRET` - secret used to sign JWT tokens
- `Allowed_origins` - allowed CORS origin(s)
- `CASHFREE_APP_ID` - Cashfree API client ID
- `CASHFREE_SECRET_KEY` - Cashfree API secret key
- `CASHFREE_ENV` - `production` or sandbox mode
- `MONGO_URI`, `MONGODB_URI`, or `DATABASE_URL` - MongoDB connection string

## API Endpoints

### Health Check

- `GET /health`
  - Returns service status.

### Authentication

- `POST /api/auth/register`
  - Body: `{ name, email, password }`
  - Creates a user and returns a JWT.

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Returns JWT and user info.

- `GET /api/auth/me`
  - Requires `Authorization: Bearer <token>`
  - Returns the authenticated user profile and orders.

### Products

- `GET /api/product/`
  - Returns all products.
  - Supports optional query: `?category=<category>`

- `GET /api/product/:id`
  - Returns a single product by ID.

- `POST /api/product/createProduct`
  - Requires admin JWT
  - Body: `{ name, price, stock, category }`
  - Creates a new product.

### Cart

- `GET /api/cart/`
  - Returns the current user cart.

- `POST /api/cart/add_item/:product_id`
  - Body: `{ quantity }`
  - Adds a product to the cart or increments existing quantity.

- `PATCH /api/cart/items/:product_id`
  - Body: `{ quantity }`
  - Updates quantity for a cart item.

- `DELETE /api/cart/items/:product_id`
  - Removes an item from the cart.

- `DELETE /api/cart/`
  - Clears the entire cart.

### Orders

- `POST /api/order/`
  - Requires authentication.
  - Body example for online payments:
    ```json
    {
      "items": [{ "product": "<productId>", "quantity": 1 }],
      "total_amount": 100,
      "payment_type": "online_payment",
      "internal_order_id": "<internalId>",
      "cf_order_id": "<cashfreeOrderId>"
    }
    ```

- `GET /api/order/`
  - Returns orders for the authenticated user.

- `GET /api/order/:order_id`
  - Returns a single order by ID.

### Payments

- `POST /api/payment/create-intent`
  - Requires authentication.
  - Body: `{ amount, currency, mobile_no }`
  - Creates a Cashfree payment order and stores a local payment record.

- `POST /api/payment/confirm`
  - Requires authentication.
  - Body: `{ order_id, internal_order_id, cf_order_id }`
  - Verifies the payment status with Cashfree.

## Important Notes and Known Issues

The codebase has a few gaps that should be addressed before production use:

- `server.js` requires `./config`, but there is no `config.js` file in the repository.
- `model/payment.js` defines the schema but does not export the model.
- `controller/order.js` imports `../model/user` instead of `../models/user` and may fail to access the correct model.
- `controller/auth.js` does not return immediately after detecting an existing email, which can allow duplicate behavior.
- `controller/product.js` uses `product_model.findAll()` instead of Mongoose's `find()` for category filtering.
- `controller/payment.js` stores `order_id` as a string while the `payment` schema expects an ObjectId reference.

## Development Recommendations

- Add a `config.js` module to initialize MongoDB with `mongoose.connect()`.
- Fix model exports and model import paths.
- Add validation for required request fields.
- Add tests and improve error handling for production readiness.
- Use a proper `package.json` dependency list if one does not already exist.

## Starting the App

Once the missing pieces are fixed and dependencies installed:

```bash
npm start
```

Then open `http://localhost:<PORT>/health` to verify the backend is running.
