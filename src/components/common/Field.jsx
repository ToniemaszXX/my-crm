export default function Field({ label, value, children, placeholder = '—' }) {
  const content = children ?? (value ?? placeholder);
  return (
    <div>
      <div className="text-neutral-400 text-xs uppercase tracking-wide">{label}</div>
      <div className="text-neutral-800 text-base">{content}</div>
    </div>
  );
}
