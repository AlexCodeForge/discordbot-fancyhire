import { AutoMessageTemplateModel, AutoMessageTemplate } from '../models/AutoMessageTemplate';
import { Logger } from '../../../shared/utils/Logger';

export interface TemplateVariables {
  [key: string]: string | number;
}

export class AutoMessageService {
  /**
   * Renderiza un template reemplazando las variables con sus valores
   * @param content Contenido del template con variables en formato {variable}
   * @param variables Objeto con los valores de las variables
   * @returns Contenido renderizado con las variables reemplazadas
   */
  static renderTemplate(content: string, variables: TemplateVariables): string {
    let rendered = content;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      rendered = rendered.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
    }

    return rendered;
  }

  /**
   * Obtiene un template por tipo y lo renderiza con las variables proporcionadas
   * @param messageType Tipo de mensaje (welcome_dm, admin_new_lead, etc.)
   * @param variables Variables para reemplazar en el template
   * @returns Template renderizado o null si no existe o está deshabilitado
   */
  static async getRenderedTemplate(
    messageType: string,
    variables: TemplateVariables
  ): Promise<{ content: string; template: AutoMessageTemplate } | null> {
    try {
      const template = await AutoMessageTemplateModel.getByType(messageType);

      if (!template) {
        Logger.warning('Auto message template not found', { messageType });
        return null;
      }

      if (!template.is_enabled) {
        Logger.info('Auto message template is disabled', { messageType });
        return null;
      }

      // Validar que todas las variables usadas en el template estén disponibles
      const usedVariables = this.extractVariablesFromContent(template.content);
      const missingVariables = usedVariables.filter(v => !(v in variables));

      if (missingVariables.length > 0) {
        Logger.warning('Missing variables for template rendering', {
          messageType,
          missingVariables,
          providedVariables: Object.keys(variables)
        });
      }

      const content = this.renderTemplate(template.content, variables);

      Logger.debug('Template rendered successfully', {
        messageType,
        variablesCount: Object.keys(variables).length
      });

      return { content, template };
    } catch (error) {
      Logger.error('Error getting rendered template', {
        messageType,
        error: (error as Error).message
      }, error as Error);
      throw error;
    }
  }

  /**
   * Extrae las variables usadas en un contenido (formato {variable})
   * @param content Contenido del template
   * @returns Array de nombres de variables
   */
  static extractVariablesFromContent(content: string): string[] {
    const regex = /\{(\w+)\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * Valida que un contenido solo use variables permitidas
   * @param content Contenido del template
   * @param allowedVariables Array de variables permitidas
   * @returns true si es válido, false si usa variables no permitidas
   */
  static validateTemplateVariables(content: string, allowedVariables: string[]): boolean {
    const usedVariables = this.extractVariablesFromContent(content);
    return usedVariables.every(v => allowedVariables.includes(v));
  }

  /**
   * Genera una vista previa del template con variables de ejemplo
   * @param messageType Tipo de mensaje
   * @param variables Variables de ejemplo para la preview
   * @returns Vista previa renderizada
   */
  static async getPreview(
    messageType: string,
    variables: TemplateVariables
  ): Promise<{ content: string; template: AutoMessageTemplate } | null> {
    try {
      const template = await AutoMessageTemplateModel.getByType(messageType);

      if (!template) {
        return null;
      }

      const content = this.renderTemplate(template.content, variables);

      return { content, template };
    } catch (error) {
      Logger.error('Error generating template preview', {
        messageType,
        error: (error as Error).message
      }, error as Error);
      throw error;
    }
  }
}
