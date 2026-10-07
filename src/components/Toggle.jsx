export default function Toggle({ checked, onChange, labelledBy, describedBy, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      className="toggle"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  );
}
