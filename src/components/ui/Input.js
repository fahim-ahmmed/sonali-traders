export default function Input({ label, error, hint, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}
      <input id={inputId} {...props} className="field" aria-invalid={!!error} />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}
      <textarea id={inputId} rows={3} {...props} className="field py-2" aria-invalid={!!error} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className={className}>
      {label && <label htmlFor={inputId} className="field-label">{label}</label>}
      <select id={inputId} {...props} className="field" aria-invalid={!!error}>{children}</select>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
