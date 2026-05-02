import { Router, Request, Response } from 'express';
import { pool } from '../shared/database/database';
import { Logger } from '../shared/utils/Logger';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      level, 
      limit = '50', 
      offset = '0', 
      startDate, 
      endDate 
    } = req.query;

    let query = 'SELECT * FROM system_logs WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (level) {
      query += ` AND level = $${paramCount}`;
      params.push(level);
      paramCount++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    const countQuery = 'SELECT COUNT(*) FROM system_logs WHERE 1=1' + 
      (level ? ` AND level = '${level}'` : '') +
      (startDate ? ` AND created_at >= '${startDate}'` : '') +
      (endDate ? ` AND created_at <= '${endDate}'` : '');
    
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    Logger.info('Logs consultados', { 
      level, 
      count: result.rows.length,
      total 
    }, req);

    res.json({
      logs: result.rows,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    Logger.error('Error consultando logs', {}, error as Error, req);
    res.status(500).json({ error: 'Error consultando logs' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        level,
        COUNT(*) as count
      FROM system_logs
      GROUP BY level
      ORDER BY 
        CASE level
          WHEN 'error' THEN 1
          WHEN 'warning' THEN 2
          WHEN 'info' THEN 3
          WHEN 'debug' THEN 4
        END
    `);

    const recentResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        level,
        COUNT(*) as count
      FROM system_logs
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at), level
      ORDER BY date DESC, level
    `);

    Logger.info('Estadísticas de logs consultadas', {}, req);

    res.json({
      byLevel: result.rows,
      recent: recentResult.rows
    });
  } catch (error) {
    Logger.error('Error consultando estadísticas', {}, error as Error, req);
    res.status(500).json({ error: 'Error consultando estadísticas' });
  }
});

router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    const retentionDays = parseInt(process.env.LOG_RETENTION_DAYS || '90');
    
    const result = await pool.query(
      `DELETE FROM system_logs 
       WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
       RETURNING id`
    );

    Logger.info('Logs antiguos eliminados', { 
      deleted: result.rowCount,
      retentionDays 
    }, req);

    res.json({ 
      message: 'Logs antiguos eliminados',
      deleted: result.rowCount,
      retentionDays
    });
  } catch (error) {
    Logger.error('Error limpiando logs', {}, error as Error, req);
    res.status(500).json({ error: 'Error limpiando logs' });
  }
});

export default router;
