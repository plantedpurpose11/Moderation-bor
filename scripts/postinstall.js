// Postinstall script to install mongoose if MONGO_URI is set
const { execSync } = require('child_process');
const fs = require('fs');

const mongoUri = process.env.MONGO_URI;

if (mongoUri && mongoUri.startsWith('mongodb')) {
    console.log('Installing mongoose for MongoDB support...');
    try {
        execSync('npm install mongoose --no-save', { stdio: 'inherit' });
        console.log('Mongoose installed successfully!');
    } catch (e) {
        console.log('Failed to install mongoose:', e.message);
    }
}