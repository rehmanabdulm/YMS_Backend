// server.js
const express = require('express');
const fs = require('fs');

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const User = require('./models/User');
const YardOwner = require('./models/YardOwner');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const FinanceEmployee = require('./models/FinanceEmployee');
const InwardForm = require('./models/InwardForm');
const makeModelDataset = require('./models/makeModelVariant');  // Import the route
const StateCityPincode = require('./models/StateCityPincode');
const cloudinary = require('cloudinary').v2;
// const makeModelDataset = require('./models/makeModelDataset'); // Import your model

const path = require('path');
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


require('dotenv').config(); // Load environment variables

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  
 // Set up multer to handle multiple photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Save files to 'uploads' folder temporarily
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    console.log(req.files); 
  }
});
const upload = multer({ storage: storage });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }
// }).any(); // Accepts any field

// Function to generate a 4-5 digit unique ID
async function generateUniqueID() {
  // Generate a random 4-5 digit number
  const randomId = Math.floor(1000 + Math.random() * 9000); // Generates a number between 1000 and 9999
  
  // Check if this ID already exists in the database to ensure uniqueness
  const exists = await InwardForm.findOne({ uniqueId: randomId });
  if (exists) {
    // Recursively call the function if the ID already exists
    return generateUniqueID();
  }
  
  return randomId;
}
// API route to receive and upload photos
// app.post('/api/inward/:id/photos', upload.fields([
//   { name: 'frontView', maxCount: 1 },
//   { name: 'rightView', maxCount: 1 },
//   { name: 'backView', maxCount: 1 },
//   { name: 'leftView', maxCount: 1 },
//   { name: 'engineView', maxCount: 1 },
//   { name: 'meterReading', maxCount: 1 },
//   // Add tyre fields (tyre1 to tyre10)
//   { name: 'tyre1', maxCount: 1 },
//   { name: 'tyre2', maxCount: 1 },
//   { name: 'tyre3', maxCount: 1 },
//   { name: 'tyre4', maxCount: 1 },
//   { name: 'tyre5', maxCount: 1 },
//   { name: 'tyre6', maxCount: 1 },
//   { name: 'tyre7', maxCount: 1 },
//   { name: 'tyre8', maxCount: 1 },
//   { name: 'tyre9', maxCount: 1 },
//   { name: 'tyre10', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const uploadedPhotos = {}; // Object to store the Cloudinary URLs for each view

//     // Helper function to upload a file to Cloudinary and store the URL
//     const uploadToCloudinary = (filePath, publicId) => {
//       return cloudinary.uploader.upload(filePath, {
//         folder: "vehicle_photos",
//         public_id: publicId // Set Cloudinary public_id as the view name
//       })
//       .then(result => {
//         uploadedPhotos[publicId] = result.secure_url;
//         fs.unlinkSync(filePath); // Remove the temporary file
//       })
//       .catch(error => {
//         console.error(`Error uploading ${publicId} to Cloudinary:`, error);
//       });
//     };

//     // Create an array of promises for each file to be uploaded
//     const uploadPromises = Object.keys(req.files).map(fieldName => {
//       const file = req.files[fieldName][0];
//       return uploadToCloudinary(file.path, fieldName);
//     });

//     // Upload all the files to Cloudinary
//     await Promise.all(uploadPromises);

//     res.status(200).json({
//       message: 'Photos uploaded successfully',
//       vehiclePhotos: uploadedPhotos
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Error uploading photos', error: error.message });
//   }
// });

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







//Inward From

// app.post('/api/inward', async (req, res) => {
//     try {
//       const inwardData = new InwardForm({
//         clientName: req.body.clientName,
//         agreementNumber: req.body.agreementNumber,
//         make: req.body.make,
//         model: req.body.model,
//         variant: req.body.variant,
//         refNo: req.body.refNo,
//         segment: req.body.segment,
//         geoLocation: req.body.geoLocation,
//         inwardDateTime: req.body.inwardDateTime,
//       });
  
//       const savedInward = await inwardData.save();
//       res.status(201).json({
//         message: 'Inward form data saved successfully',
//         data: savedInward,
//       });
//     } catch (err) {
//       res.status(400).json({
//         message: 'Error saving inward form data',
//         error: err.message,
//       });
//     }
//   });

// Multer setup for file uploads
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/');
//     },
//     filename: (req, file, cb) => {
//       cb(null, `${Date.now()}-${file.originalname}`);
//     }
//   });
//   const upload = multer({ storage });


//   API END POINT FOR INWARD FORMS
// app.post('/api/inward', async (req, res) => {
//     try {
//       const inwardData = new InwardForm({
//         clientName: req.body.clientName,
//         agreementNumber: req.body.agreementNumber,
//         make: req.body.make,
//         model: req.body.model,
//         variant: req.body.variant,
//         refNo: req.body.refNo,
//         segment: req.body.segment,
//         loanNo: req.body.loanNo,               // New field added
//         fuelType: req.body.fuelType,           // New field added
//         odometerReading: req.body.odometerReading, // New field added
//         yard: req.body.yard, 
//         inwardDateTime: req.body.inwardDateTime,                 // New field added
//         geoLocation: req.body.geoLocation,
     
//         vehicleDetails: {
//           customerName: req.body.vehicleDetails.customerName,
//           engineNumber: req.body.vehicleDetails.engineNumber,
//           chassisNumber: req.body.vehicleDetails.chassisNumber,
//           color: req.body.vehicleDetails.color,
//           vehicleClass: req.body.vehicleDetails.vehicleClass,
//           vehicleCondition: req.body.vehicleDetails.vehicleCondition,
//           keyLocation: req.body.vehicleDetails.keyLocation,
//           transmission: req.body.vehicleDetails.transmission,
//           remarks: req.body.vehicleDetails.remarks,
          
//         },
//         checklist: req.body.checklist // assuming checklist is an array of objects sent in the correct format
//       });
  
//       const savedInward = await inwardData.save();
//       res.status(201).json({
//         message: 'Inward form data saved successfully',
//         data: savedInward,
//       });
//     } catch (err) {
//       res.status(400).json({
//         message: 'Error saving inward form data',
//         error: err.message,
//       });
//     }
//   });16-11-24


app.post('/api/inward', async (req, res) => {
  try {
    // Generate a unique 4-5 digit ID
    const uniqueId = await generateUniqueID(); // Ensure generateUniqueID() is a valid async function

    // Validate required fields before proceeding
    if (!req.body.clientName || !req.body.agreementNumber) {
      return res.status(400).json({ message: 'Client Name and Agreement Number are required' });
    }

    // Create the inward form data
    const inwardData = new InwardForm({
      uniqueId, // Add the generated unique ID here
      clientName: req.body.clientName,
      agreementNumber: req.body.agreementNumber,
      make: req.body.make,
      model: req.body.model,
      variant: req.body.variant,
      refNo: req.body.refNo,
      segment: req.body.segment,
      loanNo: req.body.loanNo,
      fuelType: req.body.fuelType,
      odometerReading: req.body.odometerReading,
      yard: req.body.yard,
      inwardDateTime: req.body.inwardDateTime,
      geoLocation: req.body.geoLocation,

      // Safely access nested vehicle details
      vehicleDetails: {
        customerName: req.body.vehicleDetails?.customerName || '',
        engineNumber: req.body.vehicleDetails?.engineNumber || '',
        chassisNumber: req.body.vehicleDetails?.chassisNumber || '',
        color: req.body.vehicleDetails?.color || '',
        vehicleClass: req.body.vehicleDetails?.vehicleClass || '',
        vehicleCondition: req.body.vehicleDetails?.vehicleCondition || '',
        keyLocation: req.body.vehicleDetails?.keyLocation || '',
        transmission: req.body.vehicleDetails?.transmission || '',
        remarks: req.body.vehicleDetails?.remarks || '',
      },

      // Assuming checklist is an array of objects, make sure it is properly handled
      checklist: Array.isArray(req.body.checklist) ? req.body.checklist : [],
    });

    // Save the inward form data to the database
    const savedInward = await inwardData.save();
    res.status(201).json({
      message: 'Inward form data saved successfully',
      data: savedInward,
    });
  } catch (err) {
    // Improved error logging for better debugging
    console.error('Error saving inward form data:', err);
    res.status(400).json({
      message: 'Error saving inward form data',
      error: err.message,
    });
  }
});

//   // Route to upload vehicle photos
// app.post('/api/inward/:id/photos', upload.fields([
//     { name: 'frontView', maxCount: 1 },
//     { name: 'rightView', maxCount: 1 },
//     { name: 'backView', maxCount: 1 },
//     { name: 'leftView', maxCount: 1 },
//     { name: 'engineView', maxCount: 1 },
//     { name: 'meterReading', maxCount: 1 }
//   ]), async (req, res) => {
//     try {
//       const inwardForm = await InwardForm.findById(req.params.id);
//       if (!inwardForm) {
//         return res.status(404).json({ message: 'Inward form not found' });
//       }
  
//       // Update photo URLs in vehiclePhotos field
//       inwardForm.vehiclePhotos.frontView = req.files.frontView ? req.files.frontView[0].path : null;
//       inwardForm.vehiclePhotos.rightView = req.files.rightView ? req.files.rightView[0].path : null;
//       inwardForm.vehiclePhotos.backView = req.files.backView ? req.files.backView[0].path : null;
//       inwardForm.vehiclePhotos.leftView = req.files.leftView ? req.files.leftView[0].path : null;
//       inwardForm.vehiclePhotos.engineView = req.files.engineView ? req.files.engineView[0].path : null;
//       inwardForm.vehiclePhotos.meterReading = req.files.meterReading ? req.files.meterReading[0].path : null;
  
//       const updatedInward = await inwardForm.save();
//       res.status(200).json({ message: 'Photos uploaded successfully', data: updatedInward });
//     } catch (err) {
//       res.status(400).json({ message: 'Error uploading photos', error: err.message });
//     }
//   });
// app.post('/api/inward/:id/photos', upload.fields([
//   { name: 'frontView', maxCount: 1 },
//   { name: 'rightView', maxCount: 1 },
//   { name: 'backView', maxCount: 1 },
//   { name: 'leftView', maxCount: 1 },
//   { name: 'engineView', maxCount: 1 },
//   { name: 'meterReading', maxCount: 1 },

//   { name: 'tyre1', maxCount: 1 },
//   { name: 'tyre2', maxCount: 1 },
//   { name: 'tyre3', maxCount: 1 },
//   { name: 'tyre4', maxCount: 1 },
//   { name: 'tyre5', maxCount: 1 },
//   { name: 'tyre6', maxCount: 1 },
//   { name: 'tyre7', maxCount: 1 },
//   { name: 'tyre8', maxCount: 1 },
//   { name: 'tyre9', maxCount: 1 },
//   { name: 'tyre10', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//       const id = req.params.id;

//       // Validate ObjectId format
//       if (!mongoose.Types.ObjectId.isValid(id)) {
//           return res.status(400).json({ message: 'Invalid ID format' });
//       }

//       // Find the document by id
//       const inwardForm = await InwardForm.findById(id);
//       if (!inwardForm) {
//           return res.status(404).json({ message: 'Inward form not found' });
//       }

//       // Update photo URLs in vehiclePhotos field
//       inwardForm.vehiclePhotos.frontView = req.files.frontView ? req.files.frontView[0].path : null;
//       inwardForm.vehiclePhotos.rightView = req.files.rightView ? req.files.rightView[0].path : null;
//       inwardForm.vehiclePhotos.backView = req.files.backView ? req.files.backView[0].path : null;
//       inwardForm.vehiclePhotos.leftView = req.files.leftView ? req.files.leftView[0].path : null;
//       inwardForm.vehiclePhotos.engineView = req.files.engineView ? req.files.engineView[0].path : null;
//       inwardForm.vehiclePhotos.meterReading = req.files.meterReading ? req.files.meterReading[0].path : null;

//       // Update tire photos based on the number of fields present in the request
//       inwardForm.tyrePhotos = {};
//       for (let i = 1; i <= 10; i++) {
//           const tyreField = `tyre${i}`;
//           inwardForm.tyrePhotos[tyreField] = req.files[tyreField] ? req.files[tyreField][0].path : null;
//       }

//       const updatedInward = await inwardForm.save();
//       res.status(200).json({ message: 'Photos uploaded successfully', data: updatedInward });
//   } catch (err) {
//     console.log('Model instance:', inwardForm);

//       res.status(400).json({ message: 'Error uploading photos', error: err.message });
//   }
// });16/11/24

app.post('/api/inward/:id/photos', upload.fields([
  { name: 'frontView', maxCount: 1 },
  { name: 'rightView', maxCount: 1 },
  { name: 'backView', maxCount: 1 },
  { name: 'leftView', maxCount: 1 },
  { name: 'engineView', maxCount: 1 },
  { name: 'meterReading', maxCount: 1 },
  { name: 'tyre1', maxCount: 1 },
  { name: 'tyre2', maxCount: 1 },
  { name: 'tyre3', maxCount: 1 },
  { name: 'tyre4', maxCount: 1 },
  { name: 'tyre5', maxCount: 1 },
  { name: 'tyre6', maxCount: 1 },
  { name: 'tyre7', maxCount: 1 },
  { name: 'tyre8', maxCount: 1 },
  { name: 'tyre9', maxCount: 1 },
  { name: 'tyre10', maxCount: 1 }
]), async (req, res) => {
  try {
    // Check what files were received
    const uniqueId = req.params.id; // Get uniqueId from the URL parameter

    // Validate the uniqueId format (you can add a custom validation for your specific format if needed)
    if (!uniqueId) {
     
      return res.status(400).json({ message: 'Unique ID is required' });
 
    }

    // Find the inward form by uniqueId
    const inwardForm = await InwardForm.findOne({ uniqueId: uniqueId });

    if (!inwardForm) {
      return res.status(404).json({ message: 'Inward form not found or incomplete. Please make sure the form is created correctly.' });

    }

    const uploadedPhotos = {}; // Object to store the Cloudinary URLs for each view

    // Helper function to upload a file to Cloudinary and store the URL
    const uploadToCloudinary = (filePath, publicId) => {
      return cloudinary.uploader.upload(filePath, {
        folder: "vehicle_photos",
        public_id: publicId // Set Cloudinary public_id as the view name
      })
      .then(result => {
        uploadedPhotos[publicId] = result.secure_url;
        fs.unlinkSync(filePath); // Remove the temporary file
      })
      .catch(error => {
        console.error(`Error uploading ${publicId} to Cloudinary:`, error);
  
      });
    };

    // Create an array of promises for each file to be uploaded
    const uploadPromises = Object.keys(req.files).map(fieldName => {
      const file = req.files[fieldName][0];
      return uploadToCloudinary(file.path, fieldName);
      console.log(req.files); 
    });
  

    // Upload all the files to Cloudinary
    await Promise.all(uploadPromises);

    // Update photo URLs in the inward form with Cloudinary URLs
    inwardForm.vehiclePhotos.frontView = uploadedPhotos.frontView || null;
    inwardForm.vehiclePhotos.rightView = uploadedPhotos.rightView || null;
    inwardForm.vehiclePhotos.backView = uploadedPhotos.backView || null;
    inwardForm.vehiclePhotos.leftView = uploadedPhotos.leftView || null;
    inwardForm.vehiclePhotos.engineView = uploadedPhotos.engineView || null;
    inwardForm.vehiclePhotos.meterReading = uploadedPhotos.meterReading || null;

    // Update tire photos based on the number of fields present in the request
    inwardForm.tyrePhotos = {};
    for (let i = 1; i <= 10; i++) {
      const tyreField = `tyre${i}`;
      inwardForm.tyrePhotos[tyreField] = uploadedPhotos[tyreField] || null;
    }
    console.log(req.files); 
    // Save the updated inward form with Cloudinary photo URLs
    const updatedInward = await inwardForm.save();
    res.status(200).json({ message: 'Photos uploaded successfully', data: updatedInward });

  } catch (err) {
    console.log('Error details:', err);
    res.status(400).json({ message: 'Error uploading photos', error: err.message });
  }
});


  //MMV API
// MMV API - Add this new dataset fetching API

// Use the route for fetching the makeModelVariant dataset
app.get('/api/makeModelDataset', async (req, res) => {
    try {
        const makeModelVariants = await makeModelDataset.find({}, 'Make Model Variant Segment');
        res.status(200).json(makeModelVariants);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Code BY Abdul
// Route to fetch InwardForm details by uniqueId
app.get('/api/inward/:uniqueId', async (req, res) => {
  console.log('Received request for uniqueId:', req.params.uniqueId); // Log to check route access

  try {
    const { uniqueId } = req.params;

    // Check if uniqueId is present
    if (!uniqueId || uniqueId.trim() === '') {
      console.log('Unique ID is missing or empty');
      return res.status(400).json({ message: 'Unique ID is required' });
    }

    // Validate the ObjectId format
    if (!mongoose.Types.ObjectId.isValid(uniqueId)) {
      console.log('Invalid Unique ID format');
      return res.status(400).json({ message: 'Invalid Unique ID format' });
    }

    console.log('Unique ID validation passed, searching in database...');

    // Fetch the InwardForm by _id
    const inwardForm = await InwardForm.findById(uniqueId);

    // Check if the form exists
    if (!inwardForm) {
      console.log('No InwardForm found for uniqueId:', uniqueId);
      return res.status(404).json({ message: `No Inward form found for Unique ID: ${uniqueId}` });
    }

    console.log('InwardForm found:', inwardForm);

    // Return the fetched form
    res.status(200).json({
      message: 'Inward form retrieved successfully',
      data: inwardForm,
    });
  } catch (err) {
    console.error(`Error fetching InwardForm for Unique ID: ${req.params.uniqueId}`, err);

    res.status(500).json({
      message: 'Internal Server Error while fetching the Inward form',
      error: err.message,
    });
  }
});

 

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
