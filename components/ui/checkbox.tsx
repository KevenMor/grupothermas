import * as React from 'react'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          ref={ref}
          className={
            'h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all duration-150 ' +
            (className || '')
          }
          {...props}
        />
        {label && (
          <span className="ml-2 text-sm text-gray-700">{label}</span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox 