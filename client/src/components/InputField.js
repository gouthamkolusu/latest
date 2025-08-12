import React from 'react';

function InputField({ field, value, onChange }) {
  const {
    label,
    type,
    unit,
    options = [],
    required,
    min,
    max,
    step,
    pattern,
    help,
    group
  } = field;

  const tooltipStyle = {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  };

  const fieldId = `field-${label.replace(/\s+/g, '-').toLowerCase()}`;

  if (type === 'select') {
    return (
      <div className="input-wrapper">
        <label htmlFor={fieldId}>
          {label}{required ? ' *' : ''}
        </label>
        <select
          id={fieldId}
          name={label}
          value={value}
          onChange={onChange}
          required={required}
        >
          <option value="">Select {label}</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        {help && <div style={tooltipStyle}>{help}</div>}
      </div>
    );
  }

  return (
    <div className="input-wrapper" style={{ position: 'relative' }}>
      <label htmlFor={fieldId}>
        {label}{required ? ' *' : ''}
      </label>
      <input
        id={fieldId}
        type={type}
        name={label}
        value={value}
        onChange={onChange}
        placeholder={label + (unit ? ` (${unit})` : '')}
        required={required}
        min={min}
        max={max}
        step={step}
        pattern={pattern}
      />
      {unit && (
        <span style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '12px',
          color: '#6b7280'
        }}>{unit}</span>
      )}
      {help && <div style={tooltipStyle}>{help}</div>}
    </div>
  );
}

export default InputField;