import axios from 'axios';
import { config } from '../config';

interface AutoMessageTemplate {
  id: number;
  message_type: string;
  content: string;
  is_enabled: boolean;
  description: string | null;
  available_variables: string[];
  created_at: Date;
  updated_at: Date;
}

interface TemplateCache {
  template: AutoMessageTemplate;
  fetchedAt: number;
}

interface TemplateVariables {
  [key: string]: string | number;
}

export class MessageTemplateService {
  private static cache: Map<string, TemplateCache> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene un template desde la API con caché
   * @param messageType Tipo de mensaje
   * @returns Template o null si no existe
   */
  static async fetchTemplate(messageType: string): Promise<AutoMessageTemplate | null> {
    try {
      // Verificar caché
      const cached = this.cache.get(messageType);
      const now = Date.now();

      if (cached && (now - cached.fetchedAt) < this.CACHE_TTL) {
        console.log(`[Template Cache] Using cached template for ${messageType}`);
        return cached.template;
      }

      // Fetch desde API
      console.log(`[Template Service] Fetching template from API: ${messageType}`);
      const response = await axios.get(`${config.apiUrl}/api/auto-messages/${messageType}`, {
        timeout: 5000
      });

      const template: AutoMessageTemplate = response.data;

      // Guardar en caché
      this.cache.set(messageType, {
        template,
        fetchedAt: now
      });

      return template;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          console.error(`[Template Service] Template not found: ${messageType}`);
        } else {
          console.error(`[Template Service] Error fetching template ${messageType}:`, error.message);
        }
      } else {
        console.error(`[Template Service] Unexpected error fetching template ${messageType}:`, error);
      }
      return null;
    }
  }

  /**
   * Renderiza un template reemplazando las variables
   * @param content Contenido del template
   * @param variables Variables para reemplazar
   * @returns Contenido renderizado
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
   * Obtiene y renderiza un template en una sola operación
   * @param messageType Tipo de mensaje
   * @param variables Variables para reemplazar
   * @returns Contenido renderizado o null si el template no existe/está deshabilitado
   */
  static async getRenderedMessage(
    messageType: string,
    variables: TemplateVariables
  ): Promise<string | null> {
    try {
      const template = await this.fetchTemplate(messageType);

      if (!template) {
        console.warn(`[Template Service] Template not found: ${messageType}`);
        return null;
      }

      if (!template.is_enabled) {
        console.log(`[Template Service] Template is disabled: ${messageType}`);
        return null;
      }

      const rendered = this.renderTemplate(template.content, variables);
      console.log(`[Template Service] Template rendered successfully: ${messageType}`);

      return rendered;
    } catch (error) {
      console.error(`[Template Service] Error rendering template ${messageType}:`, error);
      return null;
    }
  }

  /**
   * Obtiene un template con su contenido renderizado y template completo
   * Útil cuando necesitas tanto el mensaje como la metadata del template
   */
  static async getTemplateWithRendered(
    messageType: string,
    variables: TemplateVariables
  ): Promise<{ content: string; template: AutoMessageTemplate } | null> {
    try {
      const template = await this.fetchTemplate(messageType);

      if (!template) {
        return null;
      }

      if (!template.is_enabled) {
        console.log(`[Template Service] Template is disabled: ${messageType}`);
        return null;
      }

      const content = this.renderTemplate(template.content, variables);

      return { content, template };
    } catch (error) {
      console.error(`[Template Service] Error getting template with rendered: ${messageType}:`, error);
      return null;
    }
  }

  /**
   * Invalida el caché de un template específico o de todos
   * @param messageType Tipo de mensaje (opcional, si no se proporciona limpia todo el caché)
   */
  static invalidateCache(messageType?: string): void {
    if (messageType) {
      this.cache.delete(messageType);
      console.log(`[Template Service] Cache invalidated for: ${messageType}`);
    } else {
      this.cache.clear();
      console.log(`[Template Service] All cache invalidated`);
    }
  }

  /**
   * Devuelve el contenido por defecto en caso de fallo
   * Útil como fallback cuando la API no está disponible
   */
  static getDefaultMessage(messageType: string): string | null {
    const defaults: Record<string, string> = {
      welcome_dm: '¡Bienvenido/a al servidor! 👋\n\nGracias por unirte. Pronto nos pondremos en contacto contigo para conocer tus necesidades.\n\nSi tienes alguna pregunta, no dudes en contactarnos.',
      admin_new_lead: '🆕 **Nuevo lead capturado automáticamente**\n👤 **Usuario:** {username}\n🆔 **ID:** {userId}\n📅 **Fecha:** {date}\n✅ Lead guardado en el CRM con ID: {leadId}',
      admin_lead_error: '⚠️ **Error al capturar lead**\nUsuario: {username}\nError: {error}',
      ticket_open: 'Ticket abierto para **{leadName}**.\nEste es un canal privado para gestionar la conversación.',
      ticket_close: '🔒 Este ticket ha sido cerrado y archivado.',
      ticket_transfer: '🔄 Ticket transferido a <@{newUserId}>'
    };

    return defaults[messageType] || null;
  }

  /**
   * Intenta obtener el mensaje desde la API, si falla usa el fallback por defecto
   * @param messageType Tipo de mensaje
   * @param variables Variables para reemplazar
   * @returns Contenido renderizado (nunca null, siempre retorna algo)
   */
  static async getMessageWithFallback(
    messageType: string,
    variables: TemplateVariables
  ): Promise<string> {
    const rendered = await this.getRenderedMessage(messageType, variables);

    if (rendered) {
      return rendered;
    }

    // Fallback a mensaje por defecto
    console.warn(`[Template Service] Using fallback message for: ${messageType}`);
    const defaultMessage = this.getDefaultMessage(messageType);

    if (defaultMessage) {
      return this.renderTemplate(defaultMessage, variables);
    }

    // Último fallback genérico
    return 'Mensaje del sistema (template no disponible)';
  }
}
