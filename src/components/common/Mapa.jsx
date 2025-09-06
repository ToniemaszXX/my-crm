export default function Mapa({ children, className = '' }) {
  return (
    <section className={`rounded-lg border border-neutral-300 p-4 mb-4 ${className}`}>
      {children}
    </section>
  );
}