# AI Meeting-to-Action System

A comprehensive full-stack application that captures meeting discussions and converts them into structured outputs like summaries, action items, and development tasks.

## Features

- **User Authentication**: Secure sign-up and login with JWT tokens
- **Meeting Management**: Create, edit, and view meetings
- **Meeting Transcripts**: Store and process meeting transcripts
- **Action Item Extraction**: Identify and track actionable tasks from meetings
- **Task Prioritization**: Set priorities (High, Medium, Low) and due dates for action items
- **Task Status Tracking**: Monitor action items as Open, In Progress, or Completed
- **Decision Documentation**: Capture key decisions made during meetings
- **Tag System**: Organize meetings with custom tags
- **Responsive Dashboard**: View all meetings and their details in an intuitive UI

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for data persistence
- **JWT** for authentication
- **Bcrypt** for password hashing

### Frontend
- **React 19** with Vite
- **React Router** for navigation
- **Axios** for API communication
- **CSS3** for styling

## Project Structure

```
Prothon_hackathon/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MeetingForm.jsx
│   │   │   ├── MeetingCard.jsx
│   │   │   ├── MeetingDetails.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── styles/
│   │   │   ├── Auth.css
│   │   │   ├── Dashboard.css
│   │   │   ├── MeetingForm.css
│   │   │   ├── MeetingCard.css
│   │   │   └── MeetingDetails.css
│   │   ├── AuthContext.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── server/
│   ├── models/
│   │   ├── User.js
│   │   └── Meeting.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── meetings.js
│   ├── middleware/
│   │   └── auth.js
│   ├── package.json
│   ├── .env
│   └── server.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/meeting-action-system
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The client will run on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Meetings
- `GET /api/meetings` - Get all user meetings (requires auth)
- `GET /api/meetings/:id` - Get specific meeting (requires auth)
- `POST /api/meetings` - Create new meeting (requires auth)
- `PUT /api/meetings/:id` - Update meeting (requires auth)
- `DELETE /api/meetings/:id` - Delete meeting (requires auth)
- `PATCH /api/meetings/:id/actions/:actionIndex` - Update action item status (requires auth)

## Usage

1. Open the application at `http://localhost:5173`
2. Sign up for a new account or login with existing credentials
3. On the dashboard, click "New Meeting" to create a meeting record
4. Fill in meeting details:
   - Meeting title
   - Meeting transcript or notes
   - Summary (optional)
   - Action items tracking
   - Tags for organization
5. View meeting details by clicking "View Details"
6. Track action items by updating their status (Open, In Progress, Completed)
7. Edit or delete meetings as needed

## Features in Detail

### Meeting Creation
- Add meeting title and transcript
- Automatically organize action items
- Add key decisions made during the meeting
- Tag meetings for easy organization

### Action Item Management
- Create action items with descriptions
- Assign to team members
- Set priority levels (High, Medium, Low)
- Set due dates
- Track progress with three status options

### Dashboard
- View all meetings at a glance
- Quick statistics (total meetings, total action items)
- Filter meetings by date range
- Card-based interface showing meeting summaries

### Meeting Details
- View full meeting transcript
- See all action items with status
- Update action item progress
- View key decisions
- Manage meeting metadata

## Environment Variables

### Server (.env)
```
MONGODB_URI=<Your MongoDB connection string>
JWT_SECRET=<Your JWT secret key>
PORT=5000
NODE_ENV=development
```

## Future Enhancements

- AI-powered transcript analysis
- Automatic action item extraction from transcripts
- Meeting audio/voice input support
- Email notifications for action items
- Team collaboration features
- Integration with project management tools (Jira, Asana)
- Advanced analytics and reporting
- Recurring meetings management

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is part of the Prothon Hackathon initiative.

## Support

For questions or issues, please contact the development team or create an issue in the repository.

---

**Happy Meeting Management!** 🚀
