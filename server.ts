import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mongoose Configuration & User-Scoped Store
mongoose.set('bufferCommands', false);

const contactSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be longer than 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email cannot be longer than 254 characters'],
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [40, 'Phone cannot be longer than 40 characters'],
      default: '',
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, 'Company cannot be longer than 100 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

const Contact: any = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

function generateId(): string {
  const hex = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += hex[Math.floor(Math.random() * 16)];
  }
  return result;
}

interface InMemoryContact {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  createdAt: string;
  updatedAt: string;
}

const inMemoryContacts: InMemoryContact[] = [];

function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function isValidId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function getRequestUserId(req: express.Request): string {
  const header = req.headers['x-user-id'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }
  return 'default_user';
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    database: isConnected() ? 'connected' : 'in-memory (MongoDB offline)',
  });
});

app.get('/api/contacts', async (req, res, next) => {
  try {
    const userId = getRequestUserId(req);
    if (isConnected()) {
      const contacts = await Contact.find({ userId }).sort({ updatedAt: -1 });
      return res.json(contacts);
    }
    const userContacts = inMemoryContacts
      .filter((c) => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    res.json(userContacts);
  } catch (error) {
    next(error);
  }
});

app.get('/api/contacts/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contact ID.' });
    }
    const userId = getRequestUserId(req);

    if (isConnected()) {
      const contact = await Contact.findOne({ _id: req.params.id, userId });
      if (!contact) return res.status(404).json({ message: 'Contact not found.' });
      return res.json(contact);
    }

    const contact = inMemoryContacts.find((c) => c._id === req.params.id && c.userId === userId);
    if (!contact) return res.status(404).json({ message: 'Contact not found.' });
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

app.post('/api/contacts', async (req, res, next) => {
  try {
    const userId = getRequestUserId(req);
    const { name, email, phone = '', company = '' } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }

    if (isConnected()) {
      const contact = await Contact.create({
        userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: String(phone || '').trim(),
        company: String(company || '').trim(),
      });
      return res.status(201).json(contact);
    }

    const now = new Date().toISOString();
    const newContact: InMemoryContact = {
      _id: generateId(),
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: String(phone || '').trim(),
      company: String(company || '').trim(),
      createdAt: now,
      updatedAt: now,
    };
    inMemoryContacts.unshift(newContact);
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

app.post('/api/contacts/seed', async (req, res, next) => {
  try {
    const userId = getRequestUserId(req);
    const samples = [
      { name: 'Jordan Lee', email: 'jordan.lee@example.com', phone: '+1 (555) 234-5678', company: 'Northwind Studio' },
      { name: 'Sarah Chen', email: 'sarah.chen@techcorp.io', phone: '+1 (555) 987-6543', company: 'TechCorp Labs' },
      { name: 'Marcus Brody', email: 'm.brody@designcollective.com', phone: '+1 (555) 345-6789', company: 'Design Collective' },
    ];

    if (isConnected()) {
      const docs = samples.map((s) => ({ ...s, userId }));
      await Contact.insertMany(docs);
      const contacts = await Contact.find({ userId }).sort({ updatedAt: -1 });
      return res.status(201).json(contacts);
    }

    const created: InMemoryContact[] = samples.map((s, i) => ({
      _id: generateId(),
      userId,
      ...s,
      createdAt: new Date(Date.now() - (3 - i) * 60000).toISOString(),
      updatedAt: new Date(Date.now() - (3 - i) * 60000).toISOString(),
    }));
    inMemoryContacts.unshift(...created);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.put('/api/contacts/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contact ID.' });
    }
    const userId = getRequestUserId(req);

    const { name, email, phone = '', company = '' } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }

    if (isConnected()) {
      const contact = await Contact.findOneAndUpdate(
        { _id: req.params.id, userId },
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: String(phone || '').trim(),
          company: String(company || '').trim(),
        },
        { new: true, runValidators: true }
      );
      if (!contact) return res.status(404).json({ message: 'Contact not found.' });
      return res.json(contact);
    }

    const index = inMemoryContacts.findIndex((c) => c._id === req.params.id && c.userId === userId);
    if (index === -1) return res.status(404).json({ message: 'Contact not found.' });

    const updatedContact: InMemoryContact = {
      ...inMemoryContacts[index],
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: String(phone || '').trim(),
      company: String(company || '').trim(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryContacts[index] = updatedContact;
    res.json(updatedContact);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/contacts/:id', async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contact ID.' });
    }
    const userId = getRequestUserId(req);

    if (isConnected()) {
      const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId });
      if (!contact) return res.status(404).json({ message: 'Contact not found.' });
      return res.status(204).end();
    }

    const index = inMemoryContacts.findIndex((c) => c._id === req.params.id && c.userId === userId);
    if (index === -1) return res.status(404).json({ message: 'Contact not found.' });
    inMemoryContacts.splice(index, 1);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Database Error Fallback Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    (err.message && err.message.includes('buffering timed out'))
  ) {
    console.warn('[AI Studio] Database offline — returning mock response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})
      .map((item: any) => item.message)
      .join(' ');
    return res.status(400).json({ message });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid contact data.' });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: 'Request body must be valid JSON.' });
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});

// Connect to MongoDB if URI provided (non-blocking)
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB.'))
    .catch((err) => console.warn('[AI Studio] MongoDB connection failed, fallback active:', err.message));
} else {
  console.log('[AI Studio] MONGODB_URI not provided — running with in-memory store.');
}

// Serve Frontend
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: Number(PORT) },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
