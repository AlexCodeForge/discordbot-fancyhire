import { useEffect, useState } from 'react';
import axios from 'axios';

interface Channel {
  id: number;
  discord_channel_id: string;
  name: string;
  type: number;
  parent_id: string | null;
  parent_name?: string;
}

interface ChannelSelectorProps {
  value: string;
  onChange: (channelId: string) => void;
  error?: string;
}

export function ChannelSelector({ value, onChange, error }: ChannelSelectorProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await axios.get('/api/channels');
        const textChannels = response.data.filter((ch: Channel) => 
          ch.type == 0 || ch.type == 5
        );
        setChannels(textChannels);
      } catch (err) {
        console.error('[ChannelSelector] Error fetching channels:', err);
        if (axios.isAxiosError(err)) {
          console.error('[ChannelSelector] Status:', err.response?.status);
          console.error('[ChannelSelector] Data:', err.response?.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  const groupedChannels = channels.reduce((acc, channel) => {
    const category = channel.parent_name || 'Sin categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(channel);
    return acc;
  }, {} as Record<string, Channel[]>);

  return (
    <div>
      <label 
        htmlFor="channel-select"
        style={{
          display: 'block',
          fontFamily: "'BMW Type Next Latin', sans-serif",
          fontSize: '14px',
          fontWeight: 700,
          lineHeight: 1.4,
          color: '#262626',
          marginBottom: '8px',
        }}
      >
        Canal destino
      </label>
      <select
        id="channel-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        style={{
          width: '100%',
          backgroundColor: '#ffffff',
          color: '#262626',
          fontFamily: "'BMW Type Next Latin', sans-serif",
          fontSize: '16px',
          fontWeight: 300,
          lineHeight: 1.55,
          border: error ? '1px solid #dc2626' : '1px solid #e6e6e6',
          borderRadius: '0px',
          padding: '14px 16px',
          height: '48px',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        <option value="">Selecciona un canal</option>
        {Object.entries(groupedChannels).map(([category, categoryChannels]) => (
          <optgroup key={category} label={category}>
            {categoryChannels.map((channel) => (
              <option key={channel.id} value={channel.discord_channel_id}>
                # {channel.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {error && (
        <p style={{
          fontFamily: "'BMW Type Next Latin', sans-serif",
          fontSize: '12px',
          fontWeight: 400,
          lineHeight: 1.4,
          color: '#dc2626',
          marginTop: '4px',
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
