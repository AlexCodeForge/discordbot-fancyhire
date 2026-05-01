import { Router } from 'express';
import { LeadModel } from '../models/Lead';
import { Logger } from '../utils/Logger';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const leads = await LeadModel.getAll();
    res.json(leads);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const lead = await LeadModel.getById(id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    res.json(lead);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const lead = await LeadModel.create(req.body);
    Logger.info('Lead creado', { leadId: lead.id, discordId: lead.discord_id }, req);
    res.status(201).json(lead);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const changed_by = req.body.changed_by;
    
    const lead = await LeadModel.update(id, req.body, changed_by);

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    Logger.info('Lead actualizado', { 
      leadId: id, 
      changes: Object.keys(req.body).filter(k => k !== 'changed_by'),
      changed_by 
    }, req);

    res.json(lead);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await LeadModel.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    Logger.warning('Lead eliminado', { leadId: id }, req);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/:id/history', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const history = await LeadModel.getHistory(id);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

export default router;
