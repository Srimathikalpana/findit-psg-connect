# FindIT Backend API

A comprehensive Lost & Found management system for PSG Tech with user authentication, item reporting, NLP matching, and admin utilities.

## Features

- 🔐 **User Authentication**: JWT-based authentication with role-based access
- 📝 **Item Management**: Report lost and found items with detailed information
- 🤖 **NLP Matching**: Automated matching using fuzzy string comparison
- 📧 **Email Notifications**: Automated email notifications for matches and claims
- 👥 **User Management**: Complete user profile and history tracking
- 🎯 **Claim System**: Secure item claiming with approval workflow
- 📊 **Admin Dashboard**: Comprehensive statistics and user management
- 🔍 **Search & Filter**: Advanced search with pagination and filtering

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Email**: Nodemailer
- **NLP Matching**: string-similarity, fuzzball
- **File Upload**: Multer (ready for implementation)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `config.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/findit_db
   JWT_SECRET=your_super_secret_jwt_key_here
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update user profile | Yes |

### Items

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/lost-items` | Get all lost items | No |
| GET | `/api/found-items` | Get all found items | No |
| GET | `/api/items/:type/:id` | Get specific item | No |
| GET | `/api/my-items` | Get user's items | Yes |
| GET | `/api/search` | Search items | No |
| POST | `/api/lost-items` | Report lost item | Yes |
| POST | `/api/found-items` | Report found item | Yes |
| PUT | `/api/items/:type/:id` | Update item | Yes |
| DELETE | `/api/items/:type/:id` | Delete item | Yes |

### Claims

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/claims` | Create claim | Yes |
| GET | `/api/claims` | Get user's claims | Yes |
| GET | `/api/claims/:id` | Get specific claim | Yes |
| PUT | `/api/claims/:id/status` | Update claim status | Yes |
| PUT | `/api/claims/:id/complete` | Complete claim | Yes |
| DELETE | `/api/claims/:id` | Cancel claim | Yes |

### Admin (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users` | Get all users | Yes + Admin |
| GET | `/api/users/:id` | Get specific user | Yes + Admin |
| PUT | `/api/users/:id/role` | Update user role | Yes + Admin |
| DELETE | `/api/users/:id` | Delete user | Yes + Admin |
| GET | `/api/users/:id/activity` | Get user activity | Yes + Admin |
| GET | `/api/stats/users` | Get user statistics | Yes + Admin |
| GET | `/api/stats/dashboard` | Get dashboard stats | Yes + Admin |

## Data Models

### User
```javascript
{
  name: String,
  email: String (unique),
  studentId: String (unique),
  password: String (hashed),
  role: String (enum: ['user', 'admin']),
  createdAt: Date,
  updatedAt: Date
}
```

### LostItem
```javascript
{
  itemName: String,
  description: String,
  placeLost: String,
  dateLost: Date,
  imageUrl: String,
  category: String,
  color: String,
  brand: String,
  reward: Number,
  isUrgent: Boolean,
  contactInfo: {
    phone: String,
    email: String
  },
  user: ObjectId (ref: User),
  status: String (enum: ['active', 'claimed', 'archived']),
  createdAt: Date,
  updatedAt: Date
}
```

### FoundItem
```javascript
{
  itemName: String,
  description: String,
  placeFound: String,
  dateFound: Date,
  imageUrl: String,
  category: String,
  color: String,
  brand: String,
  handedOverTo: String,
  storageLocation: String,
  contactInfo: {
    phone: String,
    email: String
  },
  user: ObjectId (ref: User),
  status: String (enum: ['active', 'claimed', 'archived']),
  createdAt: Date,
  updatedAt: Date
}
```

### Claim
```javascript
{
  lostItem: ObjectId (ref: LostItem),
  foundItem: ObjectId (ref: FoundItem),
  claimant: ObjectId (ref: User),
  finder: ObjectId (ref: User),
  status: String (enum: ['pending', 'approved', 'rejected', 'completed']),
  claimDate: Date,
  approvedDate: Date,
  rejectionReason: String,
  adminNotes: String,
  proofOfOwnership: String,
  meetingDetails: {
    location: String,
    date: Date,
    time: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Responses

All endpoints return consistent error responses:
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Success Responses

All endpoints return consistent success responses:
```javascript
{
  "success": true,
  "message": "Success description",
  "data": { /* response data */ }
}
```

## NLP Matching Algorithm

The system uses a weighted scoring algorithm for matching lost and found items:

1. **Name Similarity** (50% weight): Uses string-similarity library
2. **Description Similarity** (30% weight): Uses string-similarity library  
3. **Location Similarity** (20% weight): Uses fuzzball library

Matches with scores > 0.6 (60%) are considered potential matches.

## Email Notifications

The system sends automated emails for:
- Welcome emails to new users
- Match notifications when potential matches are found
- Claim notifications for claim requests and status updates

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## Development

### Running in Development
```bash
npm start
```

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_PASS`: Gmail app password
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)

## Deployment

1. Set up MongoDB Atlas cluster
2. Configure environment variables
3. Set up Gmail app password for email notifications
4. Deploy to your preferred hosting platform (Heroku, Vercel, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
