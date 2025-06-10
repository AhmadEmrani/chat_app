Express.js Real-Time Chat Application
A real-time chat application built with Express.js, Socket.IO, and MongoDB, featuring secure JWT-based authentication.
Table of Contents

Features
Technologies
Installation
Usage
JWT Authentication
API Endpoints
Contributing
License

Features

Real-time messaging using Socket.IO
Secure user authentication with JSON Web Tokens (JWT)
Persistent message storage with MongoDB
User management (add users and track chat partners)
Responsive and user-friendly front-end interface
Support for Persian (Farsi) language in the UI

Technologies

Node.js & Express.js: Backend framework for handling HTTP requests
Socket.IO: Real-time bidirectional communication
MongoDB & Mongoose: Database for storing users and messages
jsonwebtoken: Secure authentication
CORS: Cross-origin resource sharing for front-end integration
HTML/CSS/JavaScript: Front-end interface

Installation

Clone the repository:
git clone https://github.com/AhmadEmrani/chat_app_express_js.git
cd chat_app_express_js


Install dependencies:
npm install


Set up environment variables:Create a .env file in the root directory and add:
JWT_SECRET=your-secure-secret-key
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chat-app


Ensure MongoDB is running:Start MongoDB locally or update MONGODB_URI to point to your MongoDB instance.

Start the server:
npm start

The server will run on http://localhost:3000.


Usage

Access the front-end:Open index.html in a browser or serve it through a web server. The interface allows you to:

Add new users by providing a user ID and username
Start a chat by entering a receiver's user ID
Send and receive messages in real-time


Authenticate:

Obtain a JWT token by logging in (implement a login endpoint if not already present).
Use the token in the Authorization header as Bearer <token> for API requests and Socket.IO connections.


Example Socket.IO Events:

join: Join a chat room with a receiver's user ID.
sendMessage: Send a message to a specific receiver.
receiveMessage: Receive real-time messages.
chatPartners: Load the list of chat partners.



JWT Authentication
The application uses JSON Web Tokens (JWT) for secure authentication:

Token Generation: Use the generateToken function in jwt.js to create tokens containing user data (e.g., id).
Token Verification: The verifyToken middleware (for HTTP) and Socket.IO middleware validate tokens.
Security:
Store JWT_SECRET securely in the .env file.
Tokens expire after 1 hour (configurable in jwt.js).


Usage Example:const { generateToken, verifyToken } = require('./jwt');
const user = { id: '10024', username: 'example' };
const token = generateToken(user);



API Endpoints

POST /api/users (Protected)
Add a new user.
Body: { "userId": "string", "username": "string" }
Headers: Authorization: Bearer <token>
Response: { message: "User added successfully", user: {...} }



Contributing
Contributions are welcome! To contribute:

Fork the repository.
Create a new branch (git checkout -b feature-branch).
Commit your changes (git commit -m 'Add new feature').
Push to the branch (git push origin feature-branch).
Open a Pull Request.

Please ensure your code follows the project's coding style and includes appropriate tests.
License
This project is licensed under the MIT License.

Built with ❤️ by AhmadEmrani
