import { pool } from './database';

export interface DiscordRole {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface MemberPermissions {
  administrator: boolean;
  manageGuild: boolean;
  manageRoles: boolean;
  manageChannels: boolean;
  kickMembers: boolean;
  banMembers: boolean;
}

export interface DiscordMember {
  id: string;
  username: string;
  tag: string;
  display_name: string;
  avatar: string | null;
  joined_at: string | null;
  created_at: string;
  roles: DiscordRole[];
  permissions: MemberPermissions;
  updated_at?: string;
}

export interface MemberStats {
  total: number;
  topRoles: Array<{ name: string; count: number; color: string }>;
}

export class DiscordMemberModel {
  static async upsert(member: Omit<DiscordMember, 'updated_at'>): Promise<DiscordMember> {
    const result = await pool.query(
      `INSERT INTO discord_members 
        (id, username, tag, display_name, avatar, joined_at, created_at, roles, permissions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) 
       DO UPDATE SET
         username = EXCLUDED.username,
         tag = EXCLUDED.tag,
         display_name = EXCLUDED.display_name,
         avatar = EXCLUDED.avatar,
         joined_at = EXCLUDED.joined_at,
         roles = EXCLUDED.roles,
         permissions = EXCLUDED.permissions,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        member.id,
        member.username,
        member.tag,
        member.display_name,
        member.avatar,
        member.joined_at,
        member.created_at,
        JSON.stringify(member.roles),
        JSON.stringify(member.permissions),
      ]
    );
    return result.rows[0];
  }

  static async getAll(): Promise<DiscordMember[]> {
    const result = await pool.query(
      'SELECT * FROM discord_members ORDER BY display_name ASC'
    );
    return result.rows;
  }

  static async getById(id: string): Promise<DiscordMember | null> {
    const result = await pool.query(
      'SELECT * FROM discord_members WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async getRoles(): Promise<Array<{ id: string; name: string; color: string }>> {
    const result = await pool.query(`
      SELECT DISTINCT jsonb_array_elements(roles)->>'id' as id,
                      jsonb_array_elements(roles)->>'name' as name,
                      jsonb_array_elements(roles)->>'color' as color
      FROM discord_members
      WHERE jsonb_array_length(roles) > 0
      ORDER BY name
    `);
    return result.rows;
  }

  static async getStats(): Promise<MemberStats> {
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM discord_members');
    const total = parseInt(totalResult.rows[0].count, 10);

    const rolesResult = await pool.query(`
      SELECT 
        role->>'name' as name,
        role->>'color' as color,
        COUNT(*) as count
      FROM discord_members,
           jsonb_array_elements(roles) as role
      GROUP BY role->>'name', role->>'color'
      ORDER BY count DESC
      LIMIT 5
    `);

    const topRoles = rolesResult.rows.map(row => ({
      name: row.name,
      color: row.color,
      count: parseInt(row.count, 10),
    }));

    return { total, topRoles };
  }

  static async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM discord_members WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
