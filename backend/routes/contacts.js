import { Router } from 'express';
import mongoose from 'mongoose';
import Contact from '../models/Contact.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ updatedAt: -1 });
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contact ID.' });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found.' });
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const contact = await Contact.create(req.body);
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contact ID.' });
    }

    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      overwrite: true,
    });
    if (!contact) return res.status(404).json({ message: 'Contact not found.' });
    res.json(contact);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contact ID.' });
    }

    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
