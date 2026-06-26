// client/src/components/InputField.js
import React from "react";

function InputField({ field, value, onChange }) {
  const {
    label,
    type = "text",
    unit,
    options = [],
    required,
    min,
    max,
    step,
    pattern,
    help,
    // group, // removed: was unused and triggered ESLint warning
  } = field;

  const tooltipStyle = {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "4px",
  };

  const fieldId = `field-${String(label).replace(/\s+/g, "-").toLowerCase()}`;

  if (type === "select") {
    return (
      <div className="input-wrapper">
        <label htmlFor={fieldId}>
          {label}
          {required ? " *" : ""}
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
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {help && <div style={tooltipStyle}>{help}</div>}
      </div>
    );
  }

  // Only include numeric constraints for number inputs
  const numberProps =
    type === "number"
      ? {
          ...(min !== undefined ? { min } : {}),
          ...(max !== undefined ? { max } : {}),
          ...(step !== undefined ? { step } : {}),
        }
      : {};

  // Only include pattern when provided
  const patternProps =
    pattern !== undefined && pattern !== null && pattern !== ""
      ? { pattern }
      : {};

  return (
    <div className="input-wrapper" style={{ position: "relative" }}>
      <label htmlFor={fieldId}>
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={fieldId}
        type={type || "text"}
        name={label}
        value={value}
        onChange={onChange}
        placeholder={label + (unit ? ` (${unit})` : "")}
        required={required}
        {...numberProps}
        {...patternProps}
      />
      {unit && (
        <span
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "12px",
            color: "#6b7280",
          }}
        >
          {unit}
        </span>
      )}
      {help && <div style={tooltipStyle}>{help}</div>}
    </div>
  );
}

export default InputField;
