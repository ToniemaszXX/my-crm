export default function Grid({ children, className = '' }) {
  return <div className={`grid md:grid-cols-2 gap-4 ${className}`}>{children}</div>;
}
