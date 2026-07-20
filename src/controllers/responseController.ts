import { Request, Response } from 'express';
import { Form } from '../models/Form';
import { Response as FormResponse } from '../models/Response';
import { getIO } from '../config/socket';

export const submitResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const form = await Form.findById(id);
    if (!form || !form.isPublished) {
      res.status(404).json({ message: 'Form not found or is not published yet' });
      return;
    }

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({ message: 'Valid answers object is required' });
      return;
    }

    const newResponse = new FormResponse({
      formId: form._id,
      answers,
    });

    await newResponse.save();

    // Emit real-time notification
    try {
      const io = getIO();
      io.to(`form-${id}`).emit('new-response', {
        formId: form._id,
        submittedAt: newResponse.submittedAt,
        increment: true,
        response: newResponse,
      });
    } catch (socketErr) {
      console.error('Socket notification failed:', socketErr);
    }

    res.status(201).json(newResponse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const getFormResponses = async (req: Request, res: Response): Promise<void> => {
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

    const responses = await FormResponse.find({ formId: id }).sort({ submittedAt: -1 });

    res.status(200).json(responses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export const exportResponsesCSV = async (req: Request, res: Response): Promise<void> => {
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

    const responses = await FormResponse.find({ formId: id }).sort({ submittedAt: -1 });

    const escapeCSV = (val: any): string => {
      if (val === undefined || val === null) return '';
      let str = Array.isArray(val) ? val.join(', ') : String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = `"${str}"`;
      }
      return str;
    };

    // Build headers from form fields
    const headers = form.fields.map(f => escapeCSV(f.label));
    headers.push('Submitted At');

    let csvContent = headers.join(',') + '\r\n';

    // Build rows
    for (const resp of responses) {
      const row = form.fields.map(f => {
        const answer = resp.answers?.[f.fieldId];
        return escapeCSV(answer);
      });
      row.push(escapeCSV(resp.submittedAt.toISOString()));
      csvContent += row.join(',') + '\r\n';
    }

    const filename = `${form.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_responses.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};
