// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const YardOwner = require('./models/YardOwner');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const FinanceEmployee = require('./models/FinanceEmployee');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Simple endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the login API!');
});


// Add these imports at the top of server.js


//Admin Registration endpoint

app.post('/register', async (req, res) => {
    const { name, userid, password, address, pincode } = req.body;

    if (!userid) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ userid });
    if (existingUser) {
        return res.status(400).json({ message: 'User ID already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const user = new User({
        name,
        userid,
        password: hashedPassword, // Save the hashed password
        address,
        pincode,
    });

    try {
        await user.save();
        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        res.status(400).json({ message: 'Error registering user: ' + error.message });
    }
});

// Admin Login endpoint
app.post('/login', async (req, res) => {
    const { userid, password } = req.body;

    try {
        const user = await User.findOne({ userid });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// YardOwner Login endpoint
app.post('/yardowner/register', async (req, res) => {
    const { yardname, contact_person, state, district, city, pincode, phone, email, address, password } = req.body;

    // Check if yardname or email already exists
    const existingYardOwner = await YardOwner.findOne({ yardname });
    const existingEmail = await YardOwner.findOne({ email });

    if (existingYardOwner) {
        return res.status(400).json({ message: 'Yardname already exists' });
    }

    if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new YardOwner
    const yardOwner = new YardOwner({
        yardname,
        contact_person,
        state,
        district,
        city,
        pincode,
        phone,
        email,
        address,
        password: hashedPassword,
    });

    try {
        await yardOwner.save();
        res.status(201).json({ message: 'YardOwner registered successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Error registering YardOwner: ' + error.message });
    }
});

// YardOwner Login Endpoint
app.post('/yardowner/login', async (req, res) => {
    const { yardname, password } = req.body;

    try {
        // Check if YardOwner exists
        const yardOwner = await YardOwner.findOne({ yardname });
        if (!yardOwner) return res.status(400).json({ message: 'Invalid credentials' });

        // Compare password
        const isMatch = await bcrypt.compare(password, yardOwner.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT Token
        const token = jwt.sign({ id: yardOwner._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});





// Finance Login & Regiser 


app.post('/finance/register', async (req, res) => {
    const { empCode, name, designation, whatsapp, mobile, companyName, username, password } = req.body;

    // Validate that all required fields are provided
    if (!empCode || !name || !designation || !whatsapp || !mobile || !companyName || !username || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Check if the username already exists
        const existingUser = await FinanceEmployee.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Check if the employee code already exists
        const existingEmpCode = await FinanceEmployee.findOne({ empCode });
        if (existingEmpCode) {
            return res.status(400).json({ message: 'Employee Code already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new FinanceEmployee instance
        const financeEmployee = new FinanceEmployee({
            empCode,
            name,
            designation,
            whatsapp,
            mobile,
            companyName,
            username,
            password: hashedPassword // Save the hashed password
        });

        // Save the new finance employee to the database
        await financeEmployee.save();
        res.status(201).json({ message: 'Finance Employee registered successfully.' });
    } catch (error) {
        // Log the error for debugging purposes
        console.error('Error registering finance employee:', error);
        res.status(400).json({ message: 'Error registering finance employee: ' + error.message });
    }
});
// Finance Employee Login endpoint
app.post('/finance/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const financeEmployee = await FinanceEmployee.findOne({ username });
        if (!financeEmployee) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, financeEmployee.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT token
        const token = jwt.sign({ id: financeEmployee._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});









// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});