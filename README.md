# Aab Pashi Backend API

This is the backend server for the Aab Pashi mobile application, built with Node.js, Express, and MongoDB. The server provides APIs for user authentication, OTP verification, and other core functionalities of the Aab Pashi app.

## 🚀 Features

- User Authentication with Phone Number
- OTP Verification System
- MongoDB Database Integration
- RESTful API Architecture
- CORS Enabled
- Secure Database Connections
- SMS Integration via VeevoTech API

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB (MongoDB Atlas)
- VeevoTech SMS API
- dotenv for environment variables

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (Node Package Manager)
- MongoDB Atlas account
- VeevoTech API credentials

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/Farmovation/aabpashi_app_backend.git
cd aabpashi_app_backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
VEEVO_API_KEY=your_veevotech_api_key
```

4. Start the server:
```bash
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /check-phone` - Check if a phone number is registered
- `POST /send-otp` - Send OTP to a registered phone number
- `POST /verify-otp` - Verify OTP for authentication

### Health Check
- `GET /` - Server status check
- `GET /ping` - Database connection check

## 🔐 Environment Variables

The following environment variables are required:

| Variable | Description |
|----------|-------------|
| MONGODB_URI | MongoDB connection string |
| VEEVO_API_KEY | VeevoTech SMS API key |

## 🏗️ Project Structure

```
Backend/
├── Server.js          # Main server file
├── package.json       # Project dependencies
├── .env              # Environment variables
└── README.md         # Project documentation
```

## 🔒 Security

- CORS is enabled with specific origins
- MongoDB connection uses SSL/TLS
- API keys are stored in environment variables
- OTP verification system for secure authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- Farmovation Development Team

## 📞 Support

For support, email [support@farmovation.com](mailto:support@farmovation.com) or create an issue in the repository.
