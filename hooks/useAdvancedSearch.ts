import { useState, useEffect, useCallback } from 'react'

interface SearchParams {
  entity: string
  query?: string
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

interface SearchResult {
  results: any[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  facets?: any
  summary?: any
}

interface UseAdvancedSearchReturn {
  data: SearchResult | null
  loading: boolean
  error: string | null
  search: (params: SearchParams) => Promise<void>
  refetch: () => Promise<void>
  reset: () => void
}

// Advanced Search Hook
export function useAdvancedSearch(): UseAdvancedSearchReturn {
  const [data, setData] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastParams, setLastParams] = useState<SearchParams | null>(null)

  const search = useCallback(async (params: SearchParams) => {
    try {
      setLoading(true)
      setError(null)
      setLastParams(params)

      const queryParams = new URLSearchParams()
      queryParams.append('entity', params.entity)
      
      if (params.query) queryParams.append('query', params.query)
      if (params.filters) queryParams.append('filters', JSON.stringify(params.filters))
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())

      const response = await fetch(`/api/search/advanced?${queryParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Search failed')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    if (lastParams) {
      await search(lastParams)
    }
  }, [lastParams, search])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLastParams(null)
  }, [])

  return {
    data,
    loading,
    error,
    search,
    refetch,
    reset
  }
}

// Search Filters Hook for building filter UI
export function useSearchFilters(entity: string) {
  const getFilterConfig = useCallback(() => {
    switch (entity) {
      case 'appointments':
        return {
          status: {
            type: 'select',
            options: [
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'UNPAID', label: 'Unpaid' }
            ],
            multiple: true
          },
          paymentStatus: {
            type: 'select',
            options: [
              { value: 'PENDING', label: 'Pending' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'UNPAID', label: 'Unpaid' }
            ],
            multiple: true
          },
          dateFrom: {
            type: 'date',
            label: 'Date From'
          },
          dateTo: {
            type: 'date',
            label: 'Date To'
          },
          feeMin: {
            type: 'number',
            label: 'Min Fee',
            placeholder: '0'
          },
          feeMax: {
            type: 'number',
            label: 'Max Fee',
            placeholder: '10000'
          },
          patientGender: {
            type: 'select',
            options: [
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
              { value: 'OTHER', label: 'Other' }
            ]
          },
          isNewPatient: {
            type: 'select',
            options: [
              { value: 'true', label: 'New Patient' },
              { value: 'false', label: 'Returning Patient' }
            ]
          }
        }

      case 'doctors':
        return {
          specialization: {
            type: 'text',
            label: 'Specialization'
          },
          experienceMin: {
            type: 'number',
            label: 'Min Experience (years)',
            placeholder: '0'
          },
          experienceMax: {
            type: 'number',
            label: 'Max Experience (years)',
            placeholder: '50'
          },
          feeMin: {
            type: 'number',
            label: 'Min Consultation Fee',
            placeholder: '0'
          },
          feeMax: {
            type: 'number',
            label: 'Max Consultation Fee',
            placeholder: '10000'
          },
          ratingMin: {
            type: 'number',
            label: 'Min Rating',
            placeholder: '1',
            min: 1,
            max: 5,
            step: 0.1
          },
          isAvailable: {
            type: 'select',
            options: [
              { value: 'true', label: 'Available' },
              { value: 'false', label: 'Unavailable' }
            ]
          }
        }

      case 'corporate_packages':
        return {
          packageType: {
            type: 'select',
            options: [
              { value: 'ANNUAL', label: 'Annual' },
              { value: 'MONTHLY', label: 'Monthly' },
              { value: 'CUSTOM', label: 'Custom' }
            ]
          },
          isActive: {
            type: 'select',
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]
          },
          valueMin: {
            type: 'number',
            label: 'Min Package Value',
            placeholder: '0'
          },
          valueMax: {
            type: 'number',
            label: 'Max Package Value',
            placeholder: '1000000'
          },
          validFrom: {
            type: 'date',
            label: 'Valid From'
          },
          validTo: {
            type: 'date',
            label: 'Valid To'
          },
          utilizationMin: {
            type: 'number',
            label: 'Min Utilization %',
            placeholder: '0',
            min: 0,
            max: 100
          }
        }

      case 'users':
        return {
          role: {
            type: 'select',
            options: [
              { value: 'ADMIN', label: 'Admin' },
              { value: 'SUPERVISOR', label: 'Supervisor' },
              { value: 'AGENT', label: 'Agent' },
              { value: 'CORPORATE', label: 'Corporate' }
            ],
            multiple: true
          },
          isActive: {
            type: 'select',
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' }
            ]
          },
          isEmailVerified: {
            type: 'select',
            options: [
              { value: 'true', label: 'Email Verified' },
              { value: 'false', label: 'Email Not Verified' }
            ]
          },
          createdFrom: {
            type: 'date',
            label: 'Created From'
          },
          createdTo: {
            type: 'date',
            label: 'Created To'
          },
          lastLoginFrom: {
            type: 'date',
            label: 'Last Login From'
          },
          lastLoginTo: {
            type: 'date',
            label: 'Last Login To'
          }
        }

      case 'payments':
        return {
          status: {
            type: 'select',
            options: [
              { value: 'PENDING', label: 'Pending' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'CANCELLED', label: 'Cancelled' }
            ],
            multiple: true
          },
          paymentMethod: {
            type: 'select',
            options: [
              { value: 'CREDIT_CARD', label: 'Credit Card' },
              { value: 'DEBIT_CARD', label: 'Debit Card' },
              { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              { value: 'CASH', label: 'Cash' },
              { value: 'MOBILE_PAYMENT', label: 'Mobile Payment' }
            ],
            multiple: true
          },
          amountMin: {
            type: 'number',
            label: 'Min Amount',
            placeholder: '0'
          },
          amountMax: {
            type: 'number',
            label: 'Max Amount',
            placeholder: '100000'
          },
          dateFrom: {
            type: 'date',
            label: 'Date From'
          },
          dateTo: {
            type: 'date',
            label: 'Date To'
          },
          paidFrom: {
            type: 'date',
            label: 'Paid From'
          },
          paidTo: {
            type: 'date',
            label: 'Paid To'
          }
        }

      case 'hospitals':
        return {
          type: {
            type: 'text',
            label: 'Hospital Type'
          },
          city: {
            type: 'text',
            label: 'City'
          }
        }

      default:
        return {}
    }
  }, [entity])

  return {
    filterConfig: getFilterConfig()
  }
}

// Quick Search Hook for simple text searches
export function useQuickSearch() {
  const [results, setResults] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)

  const quickSearch = useCallback(async (query: string, entities: string[] = ['appointments', 'patients', 'doctors']) => {
    if (!query.trim()) {
      setResults({})
      return
    }

    try {
      setLoading(true)
      
      const searchPromises = entities.map(async (entity) => {
        const response = await fetch(`/api/search/advanced?entity=${entity}&query=${encodeURIComponent(query)}&limit=5`)
        const result = await response.json()
        return {
          entity,
          results: result.success ? result.data.results : []
        }
      })

      const searchResults = await Promise.all(searchPromises)
      const formattedResults = searchResults.reduce((acc, { entity, results }) => {
        acc[entity] = results
        return acc
      }, {} as Record<string, any[]>)

      setResults(formattedResults)
    } catch (error) {
      console.error('Quick search error:', error)
      setResults({})
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    results,
    loading,
    quickSearch
  }
}

// Search History Hook
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchParams[]>([])

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Failed to parse search history:', error)
      }
    }
  }, [])

  const addToHistory = useCallback((params: SearchParams) => {
    const newHistory = [params, ...history.filter(h => 
      !(h.entity === params.entity && h.query === params.query)
    )].slice(0, 10) // Keep only last 10 searches

    setHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }, [history])

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('searchHistory')
  }, [])

  return {
    history,
    addToHistory,
    clearHistory
  }
}

// Saved Searches Hook
export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<Array<{
    id: string
    name: string
    params: SearchParams
    createdAt: Date
  }>>([])

  useEffect(() => {
    const saved = localStorage.getItem('savedSearches')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSavedSearches(parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt)
        })))
      } catch (error) {
        console.error('Failed to parse saved searches:', error)
      }
    }
  }, [])

  const saveSearch = useCallback((name: string, params: SearchParams) => {
    const newSearch = {
      id: `search_${Date.now()}`,
      name,
      params,
      createdAt: new Date()
    }

    const updated = [...savedSearches, newSearch]
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))

    return newSearch.id
  }, [savedSearches])

  const deleteSearch = useCallback((id: string) => {
    const updated = savedSearches.filter(s => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
  }, [savedSearches])

  const getSearch = useCallback((id: string) => {
    return savedSearches.find(s => s.id === id)
  }, [savedSearches])

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    getSearch
  }
}