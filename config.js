const mongoose = require('mongoose');

const connectDB = async () => {
    const mongoUri = process.env.mongodb_uri;
    if (!mongoUri || typeof mongoUri !== 'string') {
        console.error('MongoDB connection string is missing. Set MONGO_URI, MONGODB_URI, or DATABASE_URL in your .env file.');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log(`MongoDB connected successfully ${mongoose.connection.host}`);

        // Seed default admin user or ensure correct credentials
        try {
            const User = require('./models/user');
            const bcrypt = require('bcrypt');
            const adminEmail = 'admin@gmail.com';
            const hashedPassword = await bcrypt.hash('admin@123', 10);
            const adminUser = await User.findOne({ email: adminEmail });
            if (!adminUser) {
                await User.create({
                    name: 'System Admin',
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'admin'
                });
                console.log('Successfully seeded default admin user (admin@gmail.com)');
            } else {
                adminUser.password = hashedPassword;
                adminUser.role = 'admin';
                await adminUser.save();
                console.log('Successfully updated default admin user credentials (admin@gmail.com)');
            }
        } catch (seedError) {
            console.error('Error seeding admin user:', seedError);
        }
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectDB;