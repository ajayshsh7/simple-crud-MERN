# Contact Desk

A small MERN contacts manager with separate `backend` and `frontend` applications. It supports creating, listing, searching, editing, and deleting contacts.

## Requirements

- Node.js 18 or newer
- MongoDB running locally, or a MongoDB connection string

## Start the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
# Edit .env if your MongoDB connection string is different
npm run dev
```

The API starts at `http://localhost:5000`. It connects to the MongoDB database named `contacts_app` by default.

## Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`). Set `VITE_API_URL` in `frontend/.env` if the API runs at a different address.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/contacts` | List contacts |
| `GET` | `/api/contacts/:id` | Read one contact |
| `POST` | `/api/contacts` | Create a contact |
| `PUT` | `/api/contacts/:id` | Replace a contact's details |
| `DELETE` | `/api/contacts/:id` | Delete a contact |
| `GET` | `/api/health` | Check API and database connection status |

Contact fields: `name` and `email` are required; `company` and `phone` are optional.
