import { Request } from 'express';
import { pool } from '../database/database';

type LogLevel = 'error' | 'warning' | 'info' | 'debug';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  stackTrace?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  ipAddress?: string;
}

class LoggerClass {
  private static instance: LoggerClass;
  private enabled: boolean;
  private logLevel: LogLevel;
  private levelPriority: Record<LogLevel, number> = {
    error: 0,
    warning: 1,
    info: 2,
    debug: 3
  };

  private constructor() {
    this.enabled = process.env.ENABLE_LOGGING === 'true';
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  public static getInstance(): LoggerClass {
    if (!LoggerClass.instance) {
      LoggerClass.instance = new LoggerClass();
    }
    return LoggerClass.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return this.levelPriority[level] <= this.levelPriority[this.logLevel];
  }

  private async saveToDatabase(entry: LogEntry): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO system_logs 
         (level, message, context, stack_trace, user_id, endpoint, method, ip_address) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          entry.level,
          entry.message,
          entry.context ? JSON.stringify(entry.context) : null,
          entry.stackTrace || null,
          entry.userId || null,
          entry.endpoint || null,
          entry.method || null,
          entry.ipAddress || null
        ]
      );
    } catch (error) {
      console.error('Error guardando log en base de datos:', error);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error, req?: Request): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      stackTrace: error?.stack,
      userId: (req as any)?.user?.username,
      endpoint: req?.path,
      method: req?.method,
      ipAddress: req?.ip || req?.socket?.remoteAddress
    };

    console.log(`[${level.toUpperCase()}] ${message}`, context || '');

    this.saveToDatabase(entry).catch(err => {
      console.error('Error asíncrono al guardar log:', err);
    });
  }

  public error(message: string, context?: LogContext, error?: Error, req?: Request): void {
    this.log('error', message, context, error, req);
  }

  public warning(message: string, context?: LogContext, req?: Request): void {
    this.log('warning', message, context, undefined, req);
  }

  public info(message: string, context?: LogContext, req?: Request): void {
    this.log('info', message, context, undefined, req);
  }

  public debug(message: string, context?: LogContext, req?: Request): void {
    this.log('debug', message, context, undefined, req);
  }
}

export const Logger = LoggerClass.getInstance();
