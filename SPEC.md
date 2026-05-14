# Health Tracking Web App - Specification

## Project Overview

- **Project name:** ElderCare Health Tracker
- **Type:** Multi-profile health tracking web application
- **Core functionality:** Track health data for up to 7 elderly profiles, with chat integration to MedGemma AI
- **Target users:** Caregivers managing elderly patients/family members

## Technical Stack

### Backend

- **Framework:** FastAPI
- **Port:** 8001 (to avoid conflict with MedGemma on 5002)
- **Database:** SQLite
- **Chat Forwarding:** Forwards to http://localhost:5002/chat

### Frontend

- **Type:** Single HTML file with vanilla JS
- **No build step** - serve directly with python3 -m http.server
- **Port:** 8080

## Database Schema

### profiles

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| name | TEXT | Profile name |
| age | INTEGER | Age in years |
| conditions | TEXT | Free-text conditions (e.g., "diabetes, high blood pressure") |
| notes | TEXT | Free-text health notes |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

### medications

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| profile_id | INTEGER | Foreign key to profiles |
| name | TEXT | Medication name |
| dosage | TEXT | e.g., "500mg" |
| frequency | TEXT | e.g., "twice daily" |
| time_of_day | TEXT | e.g., "morning, evening" |
| notes | TEXT | Optional notes |
| active | BOOLEAN | Whether currently active |

### symptoms

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| profile_id | INTEGER | Foreign key to profiles |
| description | TEXT | Free-text symptom description |
| severity | INTEGER | 1-5 scale (1=mild, 5=severe) |
| created_at | DATETIME | Timestamp |

### chat_messages

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| profile_id | INTEGER | Foreign key to profiles |
| role | TEXT | "user" or "bot" |
| content | TEXT | Message content |
| created_at | DATETIME | Timestamp |

### reminders

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| profile_id | INTEGER | Foreign key to profiles |
| medication_id | INTEGER | Foreign key to medications |
| time | TEXT | Time of day (e.g., "08:00") |
| enabled | BOOLEAN | Whether reminder is active |

## API Endpoints

### Profiles

- `GET /profiles` - List all profiles
- `POST /profiles` - Create profile
- `GET /profiles/{id}` - Get single profile
- `PUT /profiles/{id}` - Update profile
- `DELETE /profiles/{id}` - Delete profile

### Medications

- `GET /profiles/{id}/medications` - List medications
- `POST /profiles/{id}/medications` - Add medication
- `PUT /medications/{id}` - Update medication
- `DELETE /medications/{id}` - Delete medication

### Symptoms

- `GET /profiles/{id}/symptoms` - List symptoms
- `POST /profiles/{id}/symptoms` - Add symptom

### Chat

- `GET /profiles/{id}/chat` - Get chat history
- `POST /profiles/{id}/chat` - Send message (forwards to MedGemma)

### Reminders

- `GET /reminders` - Get all active reminders
- `POST /reminders` - Create reminder
- `DELETE /reminders/{id}` - Delete reminder

### Export

- `GET /export` - Export all data as JSON

## Frontend UI Specification

### Dashboard View

- 7 card grid layout
- Responsive: 1 column mobile, 2 columns tablet, 3-4 columns desktop
- Each card shows: Name, age, medication count, recent symptom count
- "Add Profile" button to create new profile
- Settings icon for export

### Profile View

- Back button to dashboard
- Tab navigation: Chat | Medications | Symptoms | Notes
- Large, elderly-friendly UI

### Chat Tab

- Message history with timestamps
- Input field + send button
- Typing indicator while waiting for response

### Medications Tab

- List of medications with checkboxes
- Add medication form (name, dosage, frequency, time_of_day, notes)
- Reminder toggle per medication

### Symptoms Tab

- Log entry form (description + severity slider 1-5)
- History list sorted by date (newest first)

### Notes Tab

- Simple textarea for free-text notes
- Auto-save on blur

### Design Specifications

- **Base font:** 18px
- **Buttons:** 48px height minimum
- **Colors:**
  - Background: #fafafa (light gray)
  - Text: #1a1a1a (near black)
  - Primary accent: #0ea5e9 (sky blue)
  - Secondary: #8b5cf6 (violet)
  - Success: #22c55e (green)
  - Error: #ef4444 (red)
- **Contrast:** WCAG AA compliant
- **Touch targets:** Minimum 48px

### Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Acceptance Criteria

### Backend

- [ ] FastAPI server starts on port 8001
- [ ] SQLite database created with all tables
- [ ] All CRUD endpoints work correctly
- [ ] Chat forwards to localhost:5002/chat
- [ ] Export returns valid JSON

### Frontend

- [ ] Dashboard shows up to 7 profile cards
- [ ] Can create, edit, delete profiles
- [ ] Can add medications with all fields
- [ ] Can log symptoms with severity
- [ ] Chat sends messages and displays responses
- [ ] Notes auto-save
- [ ] Export downloads JSON file
- [ ] Responsive on mobile/tablet/desktop
- [ ] 18px base font, 48px button height
