import { Router } from 'express';
import { AutoMessageTemplateModel } from '../models/AutoMessageTemplate';
import { AutoMessageService } from '../services/autoMessageService';
import { Logger } from '../../../shared/utils/Logger';

const router = Router();

// GET /api/auto-messages - Listar todos los templates
router.get('/', async (req, res, next) => {
  try {
    const templates = await AutoMessageTemplateModel.getAll();
    res.json(templates);
  } catch (error) {
    Logger.error('Error fetching auto message templates', { error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

// GET /api/auto-messages/types - Listar tipos disponibles con metadata
router.get('/types', async (req, res, next) => {
  try {
    const templates = await AutoMessageTemplateModel.getAll();
    
    const types = templates.map(template => ({
      message_type: template.message_type,
      description: template.description,
      available_variables: template.available_variables,
      is_enabled: template.is_enabled
    }));

    res.json(types);
  } catch (error) {
    Logger.error('Error fetching message types', { error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

// GET /api/auto-messages/:type - Obtener template específico
router.get('/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const template = await AutoMessageTemplateModel.getByType(type);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    Logger.error('Error fetching auto message template by type', { type: req.params.type, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

// PUT /api/auto-messages/:type - Actualizar template
router.put('/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const { content, is_enabled, description } = req.body;

    // Verificar que el template existe
    const existingTemplate = await AutoMessageTemplateModel.getByType(type);
    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Validar que las variables usadas sean permitidas
    if (content !== undefined) {
      const isValid = AutoMessageService.validateTemplateVariables(
        content,
        existingTemplate.available_variables
      );

      if (!isValid) {
        const usedVariables = AutoMessageService.extractVariablesFromContent(content);
        const invalidVariables = usedVariables.filter(
          v => !existingTemplate.available_variables.includes(v)
        );

        return res.status(400).json({
          error: 'Invalid variables used in template',
          invalid_variables: invalidVariables,
          allowed_variables: existingTemplate.available_variables
        });
      }
    }

    // Actualizar template
    const updatedTemplate = await AutoMessageTemplateModel.update(type, {
      content,
      is_enabled,
      description
    });

    if (!updatedTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    Logger.info('Auto message template updated', { 
      messageType: type, 
      updatedBy: (req as any).user?.username 
    }, req);

    res.json(updatedTemplate);
  } catch (error) {
    Logger.error('Error updating auto message template', { type: req.params.type, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

// POST /api/auto-messages/:type/preview - Vista previa con variables reemplazadas
router.post('/:type/preview', async (req, res, next) => {
  try {
    const { type } = req.params;
    const variables = req.body;

    const result = await AutoMessageService.getPreview(type, variables);

    if (!result) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      rendered_content: result.content,
      template: result.template
    });
  } catch (error) {
    Logger.error('Error generating template preview', { type: req.params.type, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

// POST /api/auto-messages/:type/reset - Restaurar template a valores por defecto
router.post('/:type/reset', async (req, res, next) => {
  try {
    const { type } = req.params;

    const template = await AutoMessageTemplateModel.resetToDefault(type);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    Logger.info('Auto message template reset requested', { 
      messageType: type, 
      requestedBy: (req as any).user?.username 
    }, req);

    res.json({
      message: 'To reset to defaults, re-run the migration',
      template
    });
  } catch (error) {
    Logger.error('Error resetting auto message template', { type: req.params.type, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

export default router;
