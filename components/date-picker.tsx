'use client'

import { useRef } from 'react'

interface DatePickerProps {
  id: string
  value: string
  onChange: (value: string) => void
  className?: string
  min?: string
  max?: string
  placeholder?: string
}

export function DatePicker({ 
  id, 
  value, 
  onChange, 
  className = '',
  min,
  max,
  placeholder = 'Select date'
}: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleContainerClick = () => {
    // Trigger the native date picker
    inputRef.current?.showPicker?.() || inputRef.current?.click()
  }

  // Format date for display
  const displayValue = value ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : placeholder

  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      onClick={handleContainerClick}
    >
      {/* Hidden native input */}
      <input
        ref={inputRef}
        type="date"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        style={{ fontSize: '16px' }} // Prevents zoom on mobile
      />
      
      {/* Visual representation */}
      <div className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 hover:border-gray-300 focus-within:border-sage transition-colors bg-white flex items-center justify-between">
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {displayValue}
        </span>
        <svg 
          className="w-5 h-5 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    </div>
  )
}