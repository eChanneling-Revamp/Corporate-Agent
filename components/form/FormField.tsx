import React, { forwardRef, useState } from 'react'
import { 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Info,
  X
} from 'lucide-react'

interface BaseFieldProps {
  name: string
  label?: string
  error?: string
  touched?: boolean
  required?: boolean
  disabled?: boolean
  helpText?: string
  showValidIcon?: boolean
  className?: string
  containerClassName?: string
  labelClassName?: string
  errorClassName?: string
}

interface InputFieldProps extends BaseFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time' | 'datetime-local'
  value: string | number
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  autoComplete?: string
  maxLength?: number
  min?: number | string
  max?: number | string
  step?: number | string
  pattern?: string
  autoFocus?: boolean
  showPasswordToggle?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// Input Field Component
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  disabled,
  helpText,
  showValidIcon = true,
  placeholder,
  autoComplete,
  maxLength,
  min,
  max,
  step,
  pattern,
  autoFocus,
  showPasswordToggle = true,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = ''
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const hasError = touched && error
  const isValid = touched && !error && value
  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className={`form-field ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={name}
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          autoFocus={autoFocus}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
          className={`
            block w-full rounded-lg border transition-all duration-200
            ${leftIcon ? 'pl-10' : 'pl-3'}
            ${rightIcon || (type === 'password' && showPasswordToggle) || (showValidIcon && (hasError || isValid)) ? 'pr-10' : 'pr-3'}
            py-2.5
            ${hasError 
              ? 'border-red-300 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50' 
              : isValid && showValidIcon
              ? 'border-green-300 text-green-900 focus:border-green-500 focus:ring-green-500 bg-green-50'
              : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${className}
          `}
        />
        
        {/* Right Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {/* Custom right icon */}
          {rightIcon && !hasError && !isValid && rightIcon}
          
          {/* Password toggle */}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
          
          {/* Validation icons */}
          {showValidIcon && hasError && (
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
          )}
          {showValidIcon && isValid && (
            <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
          )}
        </div>
      </div>
      
      {/* Help text */}
      {helpText && !hasError && (
        <p id={`${name}-help`} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
      
      {/* Error message */}
      {hasError && (
        <p id={`${name}-error`} className={`mt-1 text-sm text-red-600 animate-slideDown ${errorClassName}`}>
          {error}
        </p>
      )}
    </div>
  )
})

InputField.displayName = 'InputField'

// Textarea Field Component
interface TextareaFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  rows?: number
  maxLength?: number
  showCharCount?: boolean
  autoResize?: boolean
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  disabled,
  helpText,
  placeholder,
  rows = 4,
  maxLength,
  showCharCount = true,
  autoResize = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = ''
}, ref) => {
  const hasError = touched && error
  const charCount = value?.length || 0

  React.useEffect(() => {
    if (autoResize && ref && 'current' in ref && ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value, autoResize, ref])

  return (
    <div className={`form-field ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={name}
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          rows={autoResize ? 1 : rows}
          maxLength={maxLength}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
          className={`
            block w-full rounded-lg border transition-all duration-200
            px-3 py-2.5
            ${hasError 
              ? 'border-red-300 text-red-900 placeholder-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50' 
              : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${autoResize ? 'resize-none overflow-hidden' : 'resize-y'}
            ${className}
          `}
        />
      </div>
      
      <div className="mt-1 flex justify-between items-center">
        <div>
          {helpText && !hasError && (
            <p id={`${name}-help`} className="text-sm text-gray-500">
              {helpText}
            </p>
          )}
          {hasError && (
            <p id={`${name}-error`} className={`text-sm text-red-600 animate-slideDown ${errorClassName}`}>
              {error}
            </p>
          )}
        </div>
        
        {showCharCount && maxLength && (
          <span className={`text-sm ${charCount >= maxLength ? 'text-red-600' : 'text-gray-500'}`}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
})

TextareaField.displayName = 'TextareaField'

// Select Field Component
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectFieldProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: SelectOption[]
  placeholder?: string
  multiple?: boolean
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  disabled,
  helpText,
  options,
  placeholder = 'Select an option',
  multiple = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = ''
}, ref) => {
  const hasError = touched && error

  return (
    <div className={`form-field ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={name}
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          multiple={multiple}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
          className={`
            block w-full rounded-lg border transition-all duration-200
            px-3 py-2.5 pr-8
            ${hasError 
              ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500 bg-red-50' 
              : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
            ${!value ? 'text-gray-400' : ''}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            appearance-none
            ${className}
          `}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {helpText && !hasError && (
        <p id={`${name}-help`} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
      
      {hasError && (
        <p id={`${name}-error`} className={`mt-1 text-sm text-red-600 animate-slideDown ${errorClassName}`}>
          {error}
        </p>
      )}
    </div>
  )
})

SelectField.displayName = 'SelectField'

// Checkbox Field Component
interface CheckboxFieldProps extends Omit<BaseFieldProps, 'showValidIcon'> {
  checked: boolean
  onChange: (checked: boolean) => void
  onBlur?: () => void
  indeterminate?: boolean
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  name,
  label,
  checked,
  onChange,
  onBlur,
  error,
  touched,
  required,
  disabled,
  helpText,
  indeterminate = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = ''
}) => {
  const hasError = touched && error
  const checkboxRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <div className={`form-field ${containerClassName}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={checkboxRef}
            id={name}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
            className={`
              h-4 w-4 rounded border transition-all duration-200
              ${hasError 
                ? 'border-red-300 text-red-600 focus:ring-red-500' 
                : 'border-gray-300 text-blue-600 focus:ring-blue-500'
              }
              ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
              focus:ring-2 focus:ring-offset-0
              ${className}
            `}
          />
        </div>
        {label && (
          <div className="ml-3">
            <label 
              htmlFor={name}
              className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'} ${labelClassName}`}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {helpText && !hasError && (
              <p id={`${name}-help`} className="text-xs text-gray-500 mt-0.5">
                {helpText}
              </p>
            )}
          </div>
        )}
      </div>
      
      {hasError && (
        <p id={`${name}-error`} className={`mt-1 text-sm text-red-600 animate-slideDown ${errorClassName}`}>
          {error}
        </p>
      )}
    </div>
  )
}

// Radio Group Component
interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupProps extends BaseFieldProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  options: RadioOption[]
  orientation?: 'horizontal' | 'vertical'
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  disabled,
  helpText,
  options,
  orientation = 'vertical',
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = ''
}) => {
  const hasError = touched && error

  return (
    <div className={`form-field ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium text-gray-700 mb-2 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div 
        className={`
          ${orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2'}
          ${className}
        `}
        role="radiogroup"
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
      >
        {options.map((option) => (
          <label 
            key={option.value}
            className={`
              flex items-start cursor-pointer
              ${option.disabled || disabled ? 'opacity-60 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              onBlur={onBlur}
              disabled={option.disabled || disabled}
              className={`
                mt-0.5 h-4 w-4 border transition-all duration-200
                ${hasError 
                  ? 'border-red-300 text-red-600 focus:ring-red-500' 
                  : 'border-gray-300 text-blue-600 focus:ring-blue-500'
                }
                focus:ring-2 focus:ring-offset-0
              `}
            />
            <div className="ml-3">
              <span className="text-sm text-gray-700">
                {option.label}
              </span>
              {option.description && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {option.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      
      {helpText && !hasError && (
        <p id={`${name}-help`} className="mt-1 text-sm text-gray-500">
          {helpText}
        </p>
      )}
      
      {hasError && (
        <p id={`${name}-error`} className={`mt-1 text-sm text-red-600 animate-slideDown ${errorClassName}`}>
          {error}
        </p>
      )}
    </div>
  )
}

// Add animation styles
if (typeof window !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-slideDown {
      animation: slideDown 0.2s ease-out;
    }
  `
  document.head.appendChild(style)
}
