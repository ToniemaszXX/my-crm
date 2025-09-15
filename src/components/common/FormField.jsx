import React from 'react';

/**
 * FormField
 * A semantic wrapper for form controls that matches the visual style of Field.
 *
 * Props:
 * - id: string (used to link the label and the input)
 * - label: ReactNode (top label, styled like Field's label)
 * - required: boolean (adds an asterisk to label)
 * - hint: string (subtle helper text under the control)
 * - error: string (error text under the control; styles input as invalid)
 * - className: string (optional wrapper classes)
 * - children: a single input/select/textarea element
 */
export default function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  className = '',
  children,
}) {
  const describedBy = (hint || error) ? `${id}-desc` : undefined;

  const control = React.isValidElement(children)
    ? React.cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': describedBy,
        className: `${children.props.className ?? ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`.trim(),
      })
    : children;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-neutral-400 text-xs uppercase tracking-wide">
          {label}{required ? ' *' : ''}
        </label>
      )}
      <div className="mt-1">{control}</div>
      {error ? (
        <div id={describedBy} className="mt-1 text-sm text-red-600">{error}</div>
      ) : hint ? (
        <div id={describedBy} className="mt-1 text-xs text-neutral-500">{hint}</div>
      ) : null}
    </div>
  );
}
