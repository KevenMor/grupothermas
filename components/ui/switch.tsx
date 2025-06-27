import React from 'react';

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className = '', ...props }, ref) => (
    <label className={`inline-flex items-center cursor-pointer ${className}`}>
      <input
        ref={ref}
        type="checkbox"
        className="sr-only peer"
        {...props}
      />
      <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 transition-all"></div>
      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-md transition-all peer-checked:translate-x-4"></div>
    </label>
  )
);

Switch.displayName = 'Switch';

export default Switch; 