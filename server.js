const express = require('express');
const bodyparser = require('body-parser')
require('dotenv').config();
const auth = require('./router/auth');
const product = require('./router/product');
const order = require('./router/order');
const cart = require('./router/cart');
const connectdb = require('./config');
const helmet = require('helmet');
const payment = require('./router/payment');
const payout = require('./router/payout');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config');

const app = express();

const port = process.env.PORT;

app.set('trust proxy', 1);

connectDB();

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    noSniff: true,
    hsts: {     //need to remove while in developement
        maxAge: 31536000,
        includeSubDomains: true,
    }
}));
app.use(express.json());
app.use(bodyparser.urlencoded({ extended: true }));


// const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(','): [];
const allowedOrigins = [
    "https://harshitha-enterprises.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "https://harshithaenterpries.com",
    "https://www.harshithaenterpries.com",
    "https://admin-harshitha-enterprises.vercel.app"
];

app.use(require('cors')({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const sanitizedOrigin = origin.replace(/\/$/, '');
        
        const isAllowed = allowedOrigins.some(allowed => allowed.replace(/\/$/, '') === sanitizedOrigin);
        if (isAllowed) {
            return callback(null, true);
        }
        
        // Fallback: allow localhost, vercel.app and harshithaenterpries.com subdomains
        if (
            sanitizedOrigin.startsWith('http://localhost:') || 
            sanitizedOrigin.startsWith('https://localhost:') ||
            /https?:\/\/([a-z0-9-]+\.)?harshithaenterpries\.com$/i.test(sanitizedOrigin) ||
            /https?:\/\/([a-z0-9-]+\.)?vercel\.app$/i.test(sanitizedOrigin)
        ) {
            return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    credentials: true
}));

connectdb();

app.use((req, res, next) => {
    console.log(`Got request at ${req.url} with method ${req.method} from ${req.ip}`);
    next();
});
app.use('/api/auth',rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max : 10,
    message: 'Too many requests from this IP, please try again after 15 minutes'
}));
app.use('/api/auth',auth);
app.use('/api/product',product);
app.use('/api/cart',cart);
app.use('/api/order',rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max : 50,
    message: 'Too many requests from this IP, please try again after 15 minutes'
}));
app.use('/api/order',order);

app.get('/health',(req,res)=>{
    res.status(200).send({status: 'ok',message : "Backend is running"});
});

app.use('/api/payment',payment);
app.use('/api/payout', payout);

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
});

const server = app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`)
});

server.on ('error',(error)=>{
        console.error('Server execution error:', error);
})
