import { AnnouncementEmbed } from '../../types/Announcement';

interface AnnouncementEditorProps {
  embedData: AnnouncementEmbed;
  onChange: (embedData: AnnouncementEmbed) => void;
}

const inputStyle = {
  width: '100%',
  backgroundColor: '#ffffff',
  color: '#262626',
  fontFamily: "'BMW Type Next Latin', sans-serif",
  fontSize: '16px',
  fontWeight: 300,
  lineHeight: 1.55,
  border: '1px solid #e6e6e6',
  borderRadius: '0px',
  padding: '14px 16px',
  height: '48px',
};

const labelStyle = {
  display: 'block',
  fontFamily: "'BMW Type Next Latin', sans-serif",
  fontSize: '14px',
  fontWeight: 700,
  lineHeight: 1.4,
  color: '#262626',
  marginBottom: '8px',
};

const fieldContainerStyle = {
  marginBottom: '24px',
};

export function AnnouncementEditor({ embedData, onChange }: AnnouncementEditorProps) {
  const handleChange = (field: keyof AnnouncementEmbed, value: string) => {
    onChange({
      ...embedData,
      [field]: value || undefined,
    });
  };

  return (
    <div>
      <h3 style={{
        fontFamily: "'BMW Type Next Latin', sans-serif",
        fontSize: '24px',
        fontWeight: 700,
        lineHeight: 1.25,
        color: '#262626',
        marginBottom: '24px',
      }}>
        Editor de anuncio
      </h3>

      <div style={fieldContainerStyle}>
        <label htmlFor="title" style={labelStyle}>
          Título <span style={{ color: '#6b6b6b', fontWeight: 300 }}>(opcional, máx. 256 caracteres)</span>
        </label>
        <input
          id="title"
          type="text"
          value={embedData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          maxLength={256}
          style={inputStyle}
          placeholder="Título del anuncio"
        />
      </div>

      <div style={fieldContainerStyle}>
        <label htmlFor="description" style={labelStyle}>
          Descripción <span style={{ color: '#6b6b6b', fontWeight: 300 }}>(opcional, máx. 4096 caracteres)</span>
        </label>
        <textarea
          id="description"
          value={embedData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          maxLength={4096}
          rows={6}
          style={{
            ...inputStyle,
            height: 'auto',
            resize: 'vertical',
          }}
          placeholder="Contenido del anuncio (soporta formato básico)"
        />
      </div>

      <div style={fieldContainerStyle}>
        <label htmlFor="color" style={labelStyle}>
          Color <span style={{ color: '#6b6b6b', fontWeight: 300 }}>(opcional)</span>
        </label>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            id="color"
            type="color"
            value={embedData.color || '#1c69d4'}
            onChange={(e) => handleChange('color', e.target.value)}
            style={{
              width: '64px',
              height: '48px',
              border: '1px solid #e6e6e6',
              borderRadius: '0px',
              cursor: 'pointer',
            }}
          />
          <input
            type="text"
            value={embedData.color || '#1c69d4'}
            onChange={(e) => handleChange('color', e.target.value)}
            pattern="^#[0-9A-Fa-f]{6}$"
            style={{
              ...inputStyle,
              flex: 1,
            }}
            placeholder="#1c69d4"
          />
        </div>
      </div>

      <div style={fieldContainerStyle}>
        <label htmlFor="url" style={labelStyle}>
          URL del título <span style={{ color: '#6b6b6b', fontWeight: 300 }}>(opcional)</span>
        </label>
        <input
          id="url"
          type="url"
          value={embedData.url || ''}
          onChange={(e) => handleChange('url', e.target.value)}
          style={inputStyle}
          placeholder="https://example.com"
        />
      </div>

      <div style={fieldContainerStyle}>
        <label htmlFor="image_url" style={labelStyle}>
          Imagen principal <span style={{ color: '#6b6b6b', fontWeight: 300 }}>(URL, opcional)</span>
        </label>
        <input
          id="image_url"
          type="url"
          value={embedData.image_url || ''}
          onChange={(e) => handleChange('image_url', e.target.value)}
          style={inputStyle}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div style={fieldContainerStyle}>
        <label htmlFor="thumbnail_url" style={labelStyle}>
          Thumbnail <span style={{ color: '#6b6b6b', fontWeight: 300 }}>(URL, opcional)</span>
        </label>
        <input
          id="thumbnail_url"
          type="url"
          value={embedData.thumbnail_url || ''}
          onChange={(e) => handleChange('thumbnail_url', e.target.value)}
          style={inputStyle}
          placeholder="https://example.com/thumb.jpg"
        />
      </div>

      <div style={fieldContainerStyle}>
        <label htmlFor="author_name" style={labelStyle}>
          Author nombre <span style={{ color: '#6b6b6b', fontWeight: 300 }}>(opcional, máx. 256 caracteres)</span>
        </label>
        <input
          id="author_name"
          type="text"
          value={embedData.author_name || ''}
          onChange={(e) => handleChange('author_name', e.target.value)}
          maxLength={256}
          style={inputStyle}
          placeholder="Nombre del autor"
        />
      </div>

      <div style={fieldContainerStyle}>
        <label htmlFor="author_icon_url" style={labelStyle}>
          Author icono <span style={{ color: '#6b6b6b', fontWeight: 300 }}>(URL, opcional)</span>
        </label>
        <input
          id="author_icon_url"
          type="url"
          value={embedData.author_icon_url || ''}
          onChange={(e) => handleChange('author_icon_url', e.target.value)}
          style={inputStyle}
          placeholder="https://example.com/author.jpg"
        />
      </div>

      <div style={fieldContainerStyle}>
        <label htmlFor="footer_text" style={labelStyle}>
          Footer texto <span style={{ color: '#6b6b6b', fontWeight: 300 }}>(opcional, máx. 256 caracteres)</span>
        </label>
        <input
          id="footer_text"
          type="text"
          value={embedData.footer_text || ''}
          onChange={(e) => handleChange('footer_text', e.target.value)}
          maxLength={256}
          style={inputStyle}
          placeholder="Texto del footer"
        />
      </div>

      <div style={fieldContainerStyle}>
        <label htmlFor="footer_icon_url" style={labelStyle}>
          Footer icono <span style={{ color: '#6b6b6b', fontWeight: 300 }}>(URL, opcional)</span>
        </label>
        <input
          id="footer_icon_url"
          type="url"
          value={embedData.footer_icon_url || ''}
          onChange={(e) => handleChange('footer_icon_url', e.target.value)}
          style={inputStyle}
          placeholder="https://example.com/footer.jpg"
        />
      </div>
    </div>
  );
}
