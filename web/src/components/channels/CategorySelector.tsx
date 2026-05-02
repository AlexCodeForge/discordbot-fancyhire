import { useState, useEffect } from 'react';
import { AnnouncementCategory } from '../../types/Announcement';
import { api } from '../../services/api';

interface CategorySelectorProps {
  selectedCategoryId: number | null;
  onSelect: (categoryId: number | null) => void;
}

export function CategorySelector({ selectedCategoryId, onSelect }: CategorySelectorProps) {
  const [categories, setCategories] = useState<AnnouncementCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncementCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '8px' }}>Cargando categorías...</div>;
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          fontFamily: "'BMW Type Next Latin', sans-serif",
          fontSize: '14px',
          fontWeight: 700,
          marginBottom: '8px',
          color: '#262626',
        }}
      >
        Categoría
      </label>
      <select
        value={selectedCategoryId || ''}
        onChange={(e) => onSelect(e.target.value ? parseInt(e.target.value) : null)}
        style={{
          width: '100%',
          height: '48px',
          fontFamily: "'BMW Type Next Latin', sans-serif",
          fontSize: '16px',
          padding: '0 16px',
          border: '2px solid #d6d6d6',
          backgroundColor: '#ffffff',
          cursor: 'pointer',
        }}
      >
        <option value="">Sin categoría</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
