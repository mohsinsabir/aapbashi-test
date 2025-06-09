// import "dotenv/Backend/.env"; // Load environment variables from .env file

// const express = require("express");
// const { MongoClient } = require("mongodb");
// const cors = require("cors");
// const fetch = require("node-fetch"); // To send HTTP requests to the VeevoTech API

// const VEEVO_API_KEY = process.env.VEEVO_API_KEY; // Ensure your API key is in the environment variables

require("dotenv").config({ path: "./Backend/.env" });
console.log("Loaded VEEVO_API_KEY:", process.env.VEEVO_API_KEY);

const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const VEEVO_API_KEY = "a74a545a4b562f0673aa49b93ce86db3"; // Now this will work!

const dbName = "WaterVation";
const MONGODB_URI =
  "mongodb+srv://gabubakar757:Ic9Rw0rKylAzIaLa@farmovationpk01.n6scg.mongodb.net/?retryWrites=true&w=majority&appName=farmovationPK01";

console.log("🔍 Connecting to MongoDB Atlas...");

const app = express();
app.use(cors({
  origin: [
    'https://aapbashi-test-production.up.railway.app', // Railway backend
    'http://localhost:3000', // Local development
    'exp://localhost:19000', // Expo development
    'exp://192.168.1.14:19000', // Expo on local network
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));
app.use(express.json());

// --- Database Connection Function with SSL Options ---
let cachedClient = null;
async function connectToDatabase() {
  if (
    cachedClient &&
    cachedClient.topology &&
    cachedClient.topology.isConnected()
  ) {
    console.log("♻️ Using cached DB connection");
    return cachedClient;
  }

  try {
    console.log("🔄 Creating new MongoDB connection...");

    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      tls: true, // Enable TLS/SSL
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });

    console.log("🤝 Attempting to connect...");
    await client.connect();

    console.log("✅ MongoDB connection established successfully!");
    cachedClient = client;
    return client;
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    throw error;
  }
}

// Generate a random 4-digit OTP
function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Send OTP via VeevoTech API
async function sendOtp(phoneNumber) {
  const otp = generateOtp();
  console.log(`🔑 Generated OTP for ${phoneNumber}: ${otp}`);
  console.log("Using VEEVO_API_KEY:", VEEVO_API_KEY ? "SET" : "NOT SET"); // Debug log

  // Fetch user from database to get receiverNetwork and other info
  const client = await connectToDatabase();
  const database = client.db(dbName);
  const usersCollection = database.collection("Users");
  const existingUser = await usersCollection.findOne({ phone: phoneNumber });

  if (!existingUser) {
    throw new Error("User not found for this phone number.");
  }

  // Dynamically import node-fetch (ESM)
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

  // Send OTP SMS via VeevoTech API
  const response = await fetch("https://api.veevotech.com/v3/sendsms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hash: VEEVO_API_KEY,
      receivernum: existingUser.phone,
      receivernetwork: existingUser.receiverNetwork || "carrier_network",
      sendernum: "Default",
      textmessage:
        "Your 4-digit OTP code for Aab Pashi by Farmovation is " +
        otp +
        ". Do not share it with anyone.",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("VeevoTech API error:", errorText);
    throw new Error("Failed to send OTP: " + errorText);
  }

  // Store OTP in database or in-memory for later verification
  const otpRecord = {
    otp: otp,
    phoneNumber: phoneNumber,
    createdAt: new Date(),
  };

  // Store OTP record (in-memory example, you can save it in the database)
  global.otpStore = global.otpStore || {};
  global.otpStore[phoneNumber] = otpRecord;

  return otp;
}

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend server is running!",
    status: "active",
    timestamp: new Date().toISOString(),
    database: "WaterVation",
  });
});

app.get("/ping", async (req, res) => {
  console.log("🏓 Ping request received");

  try {
    const client = await connectToDatabase();
    const database = client.db(dbName);

    console.log("📡 Pinging database...");
    const result = await database.command({ ping: 1 });

    console.log("✅ Database ping successful");
    res.status(200).json({
      success: true,
      message: `Database connected successfully to ${dbName}`,
      timestamp: new Date().toISOString(),
      pingResult: result,
    });
  } catch (error) {
    console.error("❌ Database ping failed:", error.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.post("/check-phone", async (req, res) => {
  const { phone } = req.body;
  console.log("📱 Phone check request for:", phone);

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required.",
    });
  }

  try {
    const client = await connectToDatabase();
    const database = client.db(dbName);
    const usersCollection = database.collection("Users");

    console.log(`🔍 Searching for phone: ${phone} in Users collection`);

    const existingUser = await usersCollection.findOne({ phone: phone });

    // if (existingUser) {
    //   console.log("✅ User found with ID:", existingUser);
    //   res.status(200).json({
    //     success: true,
    //     exists: true,
    //     message: "Phone number is registered. You can proceed with OTP.",
    //     userId: existingUser._id,
    //     userData: existingUser,
    //   });
    if (existingUser) {
      // Console log all the fetched user data
      console.log("✅ User found with complete data:");
      console.log("User ID:", existingUser._id);
      console.log("Name:", existingUser.name);
      console.log("Phone:", existingUser.phone);
      console.log("Receiver Network:", existingUser.receiverNetwork);
      console.log("City:", existingUser.city);
      console.log("Country:", existingUser.country);
      console.log("Division:", existingUser.division);
      console.log("Farm Size:", existingUser.farmsize);
      console.log("Role:", existingUser.role);
      console.log("Created At:", existingUser.createdAt);
      console.log("Full User Object:", existingUser);

      res.status(200).json({
        success: true,
        exists: true,
        message: "Phone number is registered. You can proceed with OTP.",
        userId: existingUser._id,
        userData: {
          id: existingUser._id,
          name: existingUser.name,
          phone: existingUser.phone,
          receiverNetwork: existingUser.receiverNetwork,
          city: existingUser.city,
          country: existingUser.country,
          division: existingUser.division,
          farmsize: existingUser.farmsize,
          role: existingUser.role,
          createdAt: existingUser.createdAt,
        },
      });
    } else {
      console.log("❌ No user found with phone:", phone);
      res.status(404).json({
        success: false,
        exists: false,
        message: "Phone number not registered. Please register first.",
      });
    }
  } catch (error) {
    console.error("❌ Error checking phone number:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while checking phone number.",
      error: error.message,
    });
  }
});

// Endpoint to send OTP when phone is verified
app.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: "Phone number is required." });
  }

  try {
    const otp = await sendOtp(phone);
    res.status(200).json({ message: "OTP sent successfully.", otp });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
});

// Endpoint to verify OTP
app.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: "Phone and OTP are required." });
  }

  // Ensure OTP is 4 digits
  if (!/^\d{4}$/.test(otp)) {
    return res.status(400).json({ message: "OTP must be a 4-digit code." });
  }

  const otpRecord = global.otpStore && global.otpStore[phone];

  if (!otpRecord) {
    return res
      .status(404)
      .json({ message: "OTP not found for this phone number." });
  }

  const timeDifference = new Date() - otpRecord.createdAt;

  // OTP validity check (e.g., 5 minutes)
  if (timeDifference > 5 * 60 * 1000) {
    return res.status(400).json({ message: "OTP expired." });
  }

  if (otp === otpRecord.otp) {
    // OTP is correct
    res.status(200).json({ message: "OTP verified successfully." });
  } else {
    // OTP is incorrect
    res.status(400).json({ message: "Invalid OTP." });
  }
});

// Register endpoint
app.post("/register", async (req, res) => {
  const { name, phone, network, country, city, division, farmSize, role } = req.body;

  if (!name || !phone || !network || !country || !city || !division || !farmSize || !role) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  try {
    const client = await connectToDatabase();
    const database = client.db(dbName);
    const usersCollection = database.collection("Users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ phone: phone });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Phone number already registered." });
    }

    // Insert new user
    const newUser = {
      name,
      phone,
      receiverNetwork: network,
      country,
      city,
      division,
      farmsize: farmSize,
      role,
      createdAt: new Date(),
    };

    await usersCollection.insertOne(newUser);

    res.status(201).json({ success: true, message: "User registered successfully." });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
});

// API Endpoints for Fields
app.post("/getfield", async (req, res) => {
  const { userId } = req.body;
  console.log("Fetching fields for userId:", userId);

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required." });
  }

  try {
    const client = await connectToDatabase();
    const database = client.db(dbName);
    const fieldsCollection = database.collection("Fields"); // Assuming your collection is named "Fields"

    const fields = await fieldsCollection.find({ userId: userId }).toArray();
    console.log(`Found ${fields.length} fields for userId: ${userId}`);

    res.status(200).json({ success: true, fields: fields });
  } catch (error) {
    console.error("Error fetching fields:", error);
    res.status(500).json({ success: false, message: "Failed to fetch fields.", error: error.message });
  }
});

app.post("/savefield", async (req, res) => {
  const { fieldName, cropTypes, soilType, location, userId } = req.body;
  console.log("Saving new field:", { fieldName, cropTypes, soilType, location, userId });

  if (!fieldName || !cropTypes || !soilType || !location || !userId) {
    return res.status(400).json({ success: false, message: "All field data (fieldName, cropTypes, soilType, location, userId) are required." });
  }

  try {
    const client = await connectToDatabase();
    const database = client.db(dbName);
    const fieldsCollection = database.collection("Fields"); // Assuming your collection is named "Fields"

    const newField = {
      fieldName,
      cropTypes,
      soilType,
      location,
      userId,
      createdAt: new Date(),
    };

    await fieldsCollection.insertOne(newField);
    console.log("New field saved:", newField);

    res.status(201).json({ success: true, message: "Field saved successfully." });
  } catch (error) {
    console.error("Error saving field:", error);
    res.status(500).json({ success: false, message: "Failed to save field.", error: error.message });
  }
});

// API Endpoint for deleting a field
app.post("/deletefield", async (req, res) => {
  const { _id } = req.body;
  console.log("Attempting to delete field with _id:", _id);

  if (!_id) {
    return res.status(400).json({ success: false, message: "Field ID (_id) is required for deletion." });
  }

  try {
    const client = await connectToDatabase();
    const database = client.db(dbName);
    const fieldsCollection = database.collection("Fields");

    // Convert _id string to MongoDB ObjectId
    const ObjectId = require('mongodb').ObjectId; // Make sure ObjectId is imported or available
    const result = await fieldsCollection.deleteOne({ _id: new ObjectId(_id) });

    if (result.deletedCount === 1) {
      console.log("Field deleted successfully:", _id);
      res.status(200).json({ success: true, message: "Field deleted successfully." });
    } else {
      console.log("Field not found or not deleted:", _id);
      res.status(404).json({ success: false, message: "Field not found or could not be deleted." });
    }
  } catch (error) {
    console.error("Error deleting field:", error);
    res.status(500).json({ success: false, message: "Failed to delete field.", error: error.message });
  }
});

// Get canals by division
app.get("/canals/:division", async (req, res) => {
  const { division } = req.params;
  let collectionName;

  // Map division to collection name
  if (division === "RYK") {
    collectionName = "RYK_Canals";
  } else if (division === "Pandoki") {
    collectionName = "Pandoki_Canals";
  } else {
    return res.status(400).json({ success: false, message: "Invalid division." });
  }

  try {
    const client = await connectToDatabase();
    const database = client.db(dbName);
    const canalsCollection = database.collection(collectionName);

    // Fetch all canals
    const canals = await canalsCollection.find({}).toArray();

    // Format for frontend
    const formattedCanals = canals.map(canal => ({
      _id: canal._id,
      CHANNEL_NA: canal.CHANNEL_NA,
      // Add more fields if needed
    }));

    res.status(200).json({ success: true, canals: formattedCanals });
  } catch (error) {
    console.error("Error fetching canals:", error);
    res.status(500).json({ success: false, message: "Failed to fetch canals." });
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down server...");
  if (cachedClient) {
    try {
      await cachedClient.close();
      console.log("✅ Database connection closed");
    } catch (error) {
      console.error("❌ Error closing database connection:", error.message);
    }
  }
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  // console.log(`📡 Network access: http://192.168.1.14:${PORT}`);
  console.log(`📡 Network access: http://172.16.166.14:${PORT}`); //hostel
  console.log(`📡 Network access: http://172.20.153.87:${PORT}`); //slass
  console.log(`🎯 Test endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/`);
  console.log(`   GET  http://localhost:${PORT}/ping`);
  console.log(`   POST http://localhost:${PORT}/check-phone`);
  console.log(`   POST http://localhost:${PORT}/send-otp`);
  console.log(`   POST http://localhost:${PORT}/verify-otp`);

  // Test connection on startup (don't exit if it fails)
  setTimeout(() => {
    connectToDatabase()
      .then(() => {
        console.log("🎉 Startup database connection test successful!");
      })
      .catch((err) => {
        console.error("💥 Startup database connection failed:", err.message);
        console.log(
          "🔧 Server will continue running. Try the /ping endpoint to test connection."
        );
      });
  }, 1000);
});
