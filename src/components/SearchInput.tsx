import { useState, useRef, useEffect, useCallback } from 'react';
import { searchLocations, Poi } from '../api/mazemap';

interface SearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (poi: Poi) => void;
  onClear: () => void;
}

export default function SearchInput({ label, placeholder, onSelect, onClear, value, onChange }: SearchInputProps) {
  const [results, setResults] = useState<Poi[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);
    onClear();

    if (timerRef.current) clearTimeout(timerRef.current);
    setResults([]);
    setOpen(false);

    if (query.trim().length < 2) return;

    timerRef.current = setTimeout(async () => {
      try {
        const found = await searchLocations(query.trim());
        setResults(found);
        setOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  }, [onChange, onClear]);

  const handleSelect = useCallback((poi: Poi) => {
    const name = poi.title || 'Unknown';
    onChange(name);
    onSelect(poi);
    setOpen(false);
  }, [onChange, onSelect]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const isSelected = open === false && value.length > 0 && results.length === 0;

  return (
    <div className="search-group" ref={containerRef}>
      <label>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        autoComplete="off"
        value={value}
        onChange={handleInput}
        onFocus={() => { if (results.length > 0 && value.trim().length >= 2) setOpen(true); }}
        className={isSelected ? 'selected' : ''}
      />
      {open && (
        <div className="autocomplete-list">
          {results.length === 0 ? (
            <div className="autocomplete-item">
              <span className="poi-title" style={{ color: '#7b8794' }}>No results found</span>
            </div>
          ) : (
            results.map((poi, i) => {
              const name = poi.title || 'Unknown';
              const building = poi.buildingName || '';
              const floor = poi.floorName ? `Floor ${poi.floorName}` : '';
              const detail = [building, floor].filter(Boolean).join(' · ');
              return (
                <div key={i} className="autocomplete-item" onClick={() => handleSelect(poi)}>
                  <div className="poi-title">{name}</div>
                  {detail && <div className="poi-building">{detail}</div>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
