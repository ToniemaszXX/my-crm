export default function Section({ title, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-neutral-300 p-4 mb-4 ${className}`}>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
