const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

    if (!mongoUri || typeof mongoUri !== 'string') {
        console.error('MongoDB connection string is missing. Set MONGO_URI, MONGODB_URI, or DATABASE_URL in your .env file.');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log(`MongoDB connected successfully ${mongoose.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;