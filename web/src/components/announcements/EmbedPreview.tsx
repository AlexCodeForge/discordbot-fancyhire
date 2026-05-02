import { AnnouncementEmbed } from '../../types/Announcement';

interface EmbedPreviewProps {
  embedData: AnnouncementEmbed;
}

export function EmbedPreview({ embedData }: EmbedPreviewProps) {
  const hasContent = embedData.title || embedData.description || embedData.author_name;
  const borderColor = embedData.color ? embedData.color : '#1c69d4';

  return (
    <div style={{
      backgroundColor: '#36393f',
      padding: '24px',
      borderRadius: '0px',
      minHeight: '400px',
    }}>
      <p style={{
        fontFamily: "'BMW Type Next Latin', sans-serif",
        fontSize: '14px',
        fontWeight: 700,
        lineHeight: 1.4,
        color: '#ffffff',
        marginBottom: '16px',
      }}>
        Vista previa
      </p>
      
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '8px 16px',
        backgroundColor: '#2f3136',
        borderRadius: '4px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: '#5865f2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <svg width="28" height="28" viewBox="0 0 71 55" fill="white">
            <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}>
            <span style={{
              fontFamily: "'Whitney','Helvetica Neue','Helvetica','Arial',sans-serif",
              fontSize: '16px',
              fontWeight: 500,
              color: '#ffffff',
            }}>
              CRM Leads Bot
            </span>
            <span style={{
              backgroundColor: '#5865f2',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 4px',
              borderRadius: '3px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              APP
            </span>
            <span style={{
              fontFamily: "'Whitney','Helvetica Neue','Helvetica','Arial',sans-serif",
              fontSize: '12px',
              fontWeight: 400,
              color: '#a3a6aa',
            }}>
              Hoy a las {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          {!hasContent ? (
            <div style={{
              color: '#dcddde',
              fontFamily: "'Whitney','Helvetica Neue','Helvetica','Arial',sans-serif",
              fontSize: '14px',
              fontWeight: 400,
              fontStyle: 'italic',
              marginTop: '8px',
            }}>
              Completa los campos del editor para ver la vista previa del mensaje
            </div>
          ) : (
            <div style={{
              backgroundColor: '#2f3136',
              borderLeft: `4px solid ${borderColor}`,
              borderRadius: '4px',
              padding: '12px 16px',
              marginTop: '8px',
              maxWidth: '520px',
            }}>
              {embedData.author_name && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  {embedData.author_icon_url && (
                    <img 
                      src={embedData.author_icon_url}
                      alt="Author icon"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        marginRight: '8px',
                      }}
                    />
                  )}
                  <span style={{
                    fontFamily: "'Whitney','Helvetica Neue','Helvetica','Arial',sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#ffffff',
                  }}>
                    {embedData.author_name}
                  </span>
                </div>
              )}
              
              {embedData.title && (
                <div style={{
                  fontFamily: "'Whitney','Helvetica Neue','Helvetica','Arial',sans-serif",
                  fontSize: '16px',
                  fontWeight: 600,
                  color: embedData.url ? '#00aff4' : '#ffffff',
                  marginBottom: '8px',
                  cursor: embedData.url ? 'pointer' : 'default',
                }}>
                  {embedData.title}
                </div>
              )}

              {embedData.description && (
                <div style={{
                  fontFamily: "'Whitney','Helvetica Neue','Helvetica','Arial',sans-serif",
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#dcddde',
                  lineHeight: 1.375,
                  marginBottom: '8px',
                  whiteSpace: 'pre-wrap',
                }}>
                  {embedData.description}
                </div>
              )}

              {embedData.image_url && (
                <img 
                  src={embedData.image_url}
                  alt="Embed"
                  style={{
                    maxWidth: '100%',
                    borderRadius: '4px',
                    marginTop: '16px',
                  }}
                />
              )}

              {embedData.thumbnail_url && (
                <img 
                  src={embedData.thumbnail_url}
                  alt="Thumbnail"
                  style={{
                    maxWidth: '80px',
                    borderRadius: '4px',
                    float: 'right',
                  }}
                />
              )}

              {embedData.footer_text && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '8px',
                  paddingTop: '8px',
                }}>
                  {embedData.footer_icon_url && (
                    <img 
                      src={embedData.footer_icon_url}
                      alt="Footer icon"
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        marginRight: '8px',
                      }}
                    />
                  )}
                  <span style={{
                    fontFamily: "'Whitney','Helvetica Neue','Helvetica','Arial',sans-serif",
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#b9bbbe',
                  }}>
                    {embedData.footer_text}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
