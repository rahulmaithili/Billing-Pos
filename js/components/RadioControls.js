// Radio Controls & Toggle Switch Components
function RadioPill({ name, value, checked, onChange, label, icon }) {
  return (
    <label className={`radio-label-pill ${checked ? 'active' : ''}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} />
      <span>{icon && <i className={icon} style={{ marginRight: 4 }}></i>}{label}</span>
    </label>
  );
}

function ToggleSwitch({ checked, onChange, label, disabled }) {
  return (
    <label className="toggle-switch-wrap" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <input type="checkbox" className="toggle" checked={checked} onChange={onChange} disabled={disabled} />
      {label && <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>}
    </label>
  );
}
