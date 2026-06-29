import { useRef, useState } from 'react';

export default function AddressInput({
  value,
  onChange,
  onCityChange,
  onSelect,
  placeholder,
  className,
  ...inputProps
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);
  const skipBlur = useRef(false);

  const search = (query) => {
    clearTimeout(timerRef.current);
    if (query.length < 4) {
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=fr`;
        const response = await fetch(url);
        const data = await response.json();
        setSuggestions(data?.features || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 420);
  };

  const selectSuggestion = (suggestion) => {
    skipBlur.current = true;
    const properties = suggestion.properties || {};
    const street = [properties.housenumber, properties.street].filter(Boolean).join(' ').trim();
    const formatted = street || properties.name || value || '';
    const city = properties.city || properties.locality || properties.district || properties.county || '';
    const postalCode = properties.postcode || '';
    const lon = Array.isArray(suggestion.geometry?.coordinates) ? Number(suggestion.geometry.coordinates[0]) : null;
    const lat = Array.isArray(suggestion.geometry?.coordinates) ? Number(suggestion.geometry.coordinates[1]) : null;

    onChange(formatted);
    if (onCityChange && city) onCityChange(city);
    if (onSelect) {
      onSelect({
        address: formatted,
        city,
        postal_code: postalCode,
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lon) ? lon : null,
      });
    }

    setSuggestions([]);
    setTimeout(() => {
      skipBlur.current = false;
    }, 200);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        {...inputProps}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          search(event.target.value);
        }}
        onBlur={() => {
          if (!skipBlur.current) setSuggestions([]);
        }}
        autoComplete="off"
      />
      {(suggestions.length > 0 || searching) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.16)',
            zIndex: 200,
            overflow: 'hidden',
            border: '1px solid #E8EAED',
          }}
        >
          {searching && (
            <div style={{ padding: '8px 12px', fontSize: 12, color: '#9CA3AF' }}>
              Recherche…
            </div>
          )}
          {suggestions.map((suggestion, index) => {
            const properties = suggestion.properties || {};
            const street = [properties.housenumber, properties.street].filter(Boolean).join(' ').trim();
            const city = properties.city || properties.locality || properties.district || properties.county || '';
            const postal = properties.postcode || '';
            const line1 = street || properties.name || 'Adresse suggérée';
            const line2 = [city, postal].filter(Boolean).join(', ');

            return (
              <div
                key={index}
                onMouseDown={() => selectSuggestion(suggestion)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderTop: index > 0 ? '1px solid #F5F7F9' : 'none',
                  background: '#fff',
                  transition: 'background .1s',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = '#FFF4EE';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = '#fff';
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#15171C' }}>
                  {line1}
                </div>
                {line2 && (
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                    {line2}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
