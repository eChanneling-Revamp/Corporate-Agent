import { useState, useCallback, useEffect, useRef } from 'react'
import { z } from 'zod'
import { showToast } from '../components/common/ToastProvider'

interface FormState<T> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValidating: boolean
  isValid: boolean
  isDirty: boolean
}

interface UseZodFormOptions<T> {
  schema: z.ZodSchema<T>
  initialValues: T
  onSubmit?: (values: T) => void | Promise<void>
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnMount?: boolean
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all'
  revalidateMode?: 'onChange' | 'onBlur' | 'onSubmit'
  showToastOnError?: boolean
  focusOnError?: boolean
}

export function useZodForm<T extends Record<string, any>>({
  schema,
  initialValues,
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
  validateOnMount = false,
  mode = 'all',
  revalidateMode = 'onChange',
  showToastOnError = true,
  focusOnError = true
}: UseZodFormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValidating: false,
    isValid: true,
    isDirty: false
  })

  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})
  const isFirstSubmitRef = useRef(true)

  // Validate single field
  const validateField = useCallback((name: keyof T, value: any): string | undefined => {
    try {
      const fieldSchema = schema.shape?.[name as string] || schema
      fieldSchema.parse(value)
      return undefined
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message
      }
      return 'Validation error'
    }
  }, [schema])

  // Validate all fields
  const validateForm = useCallback(async (values: T): Promise<Partial<Record<keyof T, string>>> => {
    try {
      await schema.parseAsync(values)
      return {}
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof T, string>> = {}
        error.errors.forEach((err) => {
          const path = err.path.join('.') as keyof T
          if (!errors[path]) {
            errors[path] = err.message
          }
        })
        return errors
      }
      return {}
    }
  }, [schema])

  // Handle field change
  const handleChange = useCallback(async (name: keyof T, value: any) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, [name]: value },
      isDirty: true
    }))

    // Validate on change if enabled
    if (validateOnChange && (mode === 'onChange' || mode === 'all' || 
        (!isFirstSubmitRef.current && revalidateMode === 'onChange'))) {
      setFormState(prev => ({ ...prev, isValidating: true }))
      
      const error = validateField(name, value)
      
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [name]: error
        },
        isValidating: false,
        isValid: !error && Object.keys(prev.errors).filter(k => k !== name).every(k => !prev.errors[k as keyof T])
      }))
    }
  }, [validateField, validateOnChange, mode, revalidateMode])

  // Handle field blur
  const handleBlur = useCallback(async (name: keyof T) => {
    setFormState(prev => ({
      ...prev,
      touched: { ...prev.touched, [name]: true }
    }))

    // Validate on blur if enabled
    if (validateOnBlur && (mode === 'onBlur' || mode === 'all' || 
        (!isFirstSubmitRef.current && revalidateMode === 'onBlur'))) {
      setFormState(prev => ({ ...prev, isValidating: true }))
      
      const value = formState.values[name]
      const error = validateField(name, value)
      
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [name]: error
        },
        isValidating: false,
        isValid: !error && Object.keys(prev.errors).filter(k => k !== name).every(k => !prev.errors[k as keyof T])
      }))
    }
  }, [formState.values, validateField, validateOnBlur, mode, revalidateMode])

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    isFirstSubmitRef.current = false

    setFormState(prev => ({ 
      ...prev, 
      isSubmitting: true,
      isValidating: true,
      touched: Object.keys(prev.values).reduce((acc, key) => ({
        ...acc,
        [key]: true
      }), {} as Partial<Record<keyof T, boolean>>)
    }))

    // Validate form
    const errors = await validateForm(formState.values)
    const hasErrors = Object.keys(errors).length > 0

    if (hasErrors) {
      setFormState(prev => ({
        ...prev,
        errors,
        isSubmitting: false,
        isValidating: false,
        isValid: false
      }))

      // Show toast if enabled
      if (showToastOnError) {
        const errorCount = Object.keys(errors).length
        showToast.error(`Please fix ${errorCount} validation error${errorCount > 1 ? 's' : ''} before submitting`)
      }

      // Focus on first error field
      if (focusOnError) {
        const firstErrorField = Object.keys(errors)[0]
        const fieldRef = fieldRefs.current[firstErrorField]
        if (fieldRef && 'focus' in fieldRef) {
          (fieldRef as HTMLInputElement).focus()
        }
      }

      return
    }

    setFormState(prev => ({
      ...prev,
      errors: {},
      isValidating: false,
      isValid: true
    }))

    // Call onSubmit handler
    if (onSubmit) {
      try {
        await onSubmit(formState.values)
        setFormState(prev => ({ ...prev, isSubmitting: false }))
      } catch (error) {
        setFormState(prev => ({ ...prev, isSubmitting: false }))
        if (showToastOnError) {
          showToast.error('Failed to submit form. Please try again.')
        }
        throw error
      }
    } else {
      setFormState(prev => ({ ...prev, isSubmitting: false }))
    }
  }, [formState.values, validateForm, onSubmit, showToastOnError, focusOnError])

  // Reset form
  const reset = useCallback((values?: Partial<T>) => {
    setFormState({
      values: values ? { ...initialValues, ...values } : initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValidating: false,
      isValid: true,
      isDirty: false
    })
    isFirstSubmitRef.current = true
  }, [initialValues])

  // Set field value
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    handleChange(name, value)
  }, [handleChange])

  // Set multiple field values
  const setFieldValues = useCallback((values: Partial<T>) => {
    setFormState(prev => ({
      ...prev,
      values: { ...prev.values, ...values },
      isDirty: true
    }))
  }, [])

  // Set field error
  const setFieldError = useCallback((name: keyof T, error: string | undefined) => {
    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [name]: error
      },
      isValid: !error && Object.keys(prev.errors).filter(k => k !== name).every(k => !prev.errors[k as keyof T])
    }))
  }, [])

  // Set multiple field errors
  const setFieldErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setFormState(prev => ({
      ...prev,
      errors,
      isValid: Object.keys(errors).every(k => !errors[k as keyof T])
    }))
  }, [])

  // Register field ref
  const register = useCallback((name: keyof T) => ({
    ref: (el: HTMLElement | null) => {
      fieldRefs.current[name as string] = el
    },
    name,
    value: formState.values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const target = e.target
      const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value
      handleChange(name, value)
    },
    onBlur: () => handleBlur(name),
    'aria-invalid': !!formState.errors[name],
    'aria-describedby': formState.errors[name] ? `${name}-error` : undefined
  }), [formState.values, formState.errors, handleChange, handleBlur])

  // Get field props (alternative to register)
  const getFieldProps = useCallback((name: keyof T) => ({
    value: formState.values[name],
    error: formState.touched[name] ? formState.errors[name] : undefined,
    touched: formState.touched[name],
    onChange: (value: any) => handleChange(name, value),
    onBlur: () => handleBlur(name)
  }), [formState.values, formState.errors, formState.touched, handleChange, handleBlur])

  // Get field state
  const getFieldState = useCallback((name: keyof T) => ({
    value: formState.values[name],
    error: formState.errors[name],
    touched: formState.touched[name],
    invalid: !!formState.errors[name],
    isDirty: formState.values[name] !== initialValues[name]
  }), [formState, initialValues])

  // Validate on mount if enabled
  useEffect(() => {
    if (validateOnMount) {
      validateForm(formState.values).then(errors => {
        setFormState(prev => ({
          ...prev,
          errors,
          isValid: Object.keys(errors).length === 0
        }))
      })
    }
  }, []) // Only run on mount

  // Watch for specific field changes
  const watch = useCallback((name?: keyof T) => {
    if (name) {
      return formState.values[name]
    }
    return formState.values
  }, [formState.values])

  return {
    // Form state
    values: formState.values,
    errors: formState.errors,
    touched: formState.touched,
    isSubmitting: formState.isSubmitting,
    isValidating: formState.isValidating,
    isValid: formState.isValid,
    isDirty: formState.isDirty,
    
    // Form methods
    handleSubmit,
    handleChange,
    handleBlur,
    reset,
    setFieldValue,
    setFieldValues,
    setFieldError,
    setFieldErrors,
    validateField,
    validateForm,
    
    // Field helpers
    register,
    getFieldProps,
    getFieldState,
    watch,
    
    // Utils
    formState
  }
}

// Re-export for convenience
export type { FormState, UseZodFormOptions }
