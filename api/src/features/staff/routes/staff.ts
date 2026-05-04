import { Router } from 'express';
import { DiscordMemberModel } from '../../discord/models/DiscordMemberModel';
import { SettingsModel } from '../../settings/models/SettingsModel';
import { Logger } from '../../../shared/utils/Logger';

const router = Router();

router.get('/members', async (req, res) => {
  try {
    const staffRoleSetting = await SettingsModel.get('staff_role_id');
    
    if (!staffRoleSetting || !staffRoleSetting.value) {
      return res.json([]);
    }
    
    const members = await DiscordMemberModel.getByRole(staffRoleSetting.value);
    
    const staffMembers = members.map(member => ({
      id: member.id,
      username: member.username,
      display_name: member.display_name,
      avatar: member.avatar,
    }));
    
    res.json(staffMembers);
  } catch (error) {
    Logger.error('Error fetching staff members', error, req);
    res.status(500).json({ error: 'Error al obtener miembros del staff' });
  }
});

export default router;
