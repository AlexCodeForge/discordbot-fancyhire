import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/Logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  Logger.error(
    err.message || 'Error no identificado',
    {
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query
    },
    err,
    req
  );

  if (err.message.includes('duplicate key')) {
    return res.status(409).json({ error: 'Ya existe un lead con ese Discord ID' });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
};
