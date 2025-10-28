export default function Section({ title, children, className = '', ...rest }) {
  return (
    <section
      className={`rounded-lg border text-gray-600 border-neutral-300 p-4 mb-4 ${className}`}
      {...rest}
    >
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
