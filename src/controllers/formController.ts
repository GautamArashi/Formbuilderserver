import { Request, Response } from 'express';
import { Form } from '../models/Form';

export const createForm = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Not authorized, no user data found' });
      return;
    }

    const { title, description, fields } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const newForm = new Form({
      title,
      description,
      owner: req.user.id,
      fields: fields || [],
      theme: {
        primaryColor: '#4f46e5',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter',
      },
    });

    await newForm.save();

    res.status(201).json(newForm);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getMyForms = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Not authorized, no user data found' });
      return;
    }

    const forms = await Form.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const formsWithCount = forms.map(form => ({
      ...form,
      fieldCount: form.fields ? form.fields.length : 0
    }));

    res.status(200).json(formsWithCount);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getFormById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Not authorized, no user data found' });
      return;
    }

    const { id } = req.params;
    const form = await Form.findById(id);

    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    // Check ownership
    if (form.owner.toString() !== req.user.id) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const updateForm = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Not authorized, no user data found' });
      return;
    }

    const { id } = req.params;
    const form = await Form.findById(id);

    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    // Check ownership
    if (form.owner.toString() !== req.user.id) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    const { title, description, fields, isPublished, theme, isPaid, price } = req.body;

    if (title !== undefined) form.title = title;
    if (description !== undefined) form.description = description;
    if (fields !== undefined) form.fields = fields;
    if (isPublished !== undefined) form.isPublished = isPublished;
    if (theme !== undefined) form.theme = theme;
    if (isPaid !== undefined) form.isPaid = isPaid;
    if (price !== undefined) form.price = price;

    await form.save();

    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const deleteForm = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Not authorized, no user data found' });
      return;
    }

    const { id } = req.params;
    const form = await Form.findById(id);

    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    // Check ownership
    if (form.owner.toString() !== req.user.id) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    await form.deleteOne();

    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getPublicForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const form = await Form.findById(id).select('title description fields isPublished theme isPaid price');

    if (!form || !form.isPublished) {
      res.status(404).json({ message: 'Form not found or is not published yet' });
      return;
    }

    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const duplicateForm = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Not authorized, no user data found' });
      return;
    }

    const { id } = req.params;
    const form = await Form.findById(id);

    if (!form) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    // Verify ownership
    if (form.owner.toString() !== req.user.id) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    // Create a duplicated form
    const duplicatedForm = new Form({
      title: `${form.title} (Copy)`,
      description: form.description,
      fields: form.fields || [],
      isPublished: false,
      owner: req.user.id,
      theme: form.theme,
      isPaid: form.isPaid,
      price: form.price,
    });

    await duplicatedForm.save();

    res.status(201).json(duplicatedForm);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
