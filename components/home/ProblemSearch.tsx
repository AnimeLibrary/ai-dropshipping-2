'use client'

import { useState } from 'react'

export default function ProblemSearch() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setIsSearching(true)
    // Simulate finding a solution
    setTimeout(() => {
      setIsSearching(false)
      window.location.href = `/solutions`
    }, 1200)
  }

  return (
    <form 
      onSubmit={handleSearch}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-bg)',
        border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-full)',
        padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-6)',
        maxWidth: 500,
        margin: '0 auto',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        opacity: isSearching ? 0.7 : 1,
        transition: 'opacity 0.2s ease'
      }}
    >
      <span style={{ fontSize: 20, marginRight: 'var(--space-3)' }}>🔍</span>
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="E.g. back pain at work, can't sleep..." 
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--text-base)',
          width: '100%',
          outline: 'none',
        }}
        disabled={isSearching}
      />
      <button 
        type="submit"
        className="btn btn-primary" 
        style={{ borderRadius: 'var(--radius-full)' }}
        disabled={isSearching}
      >
        {isSearching ? '...' : 'Search'}
      </button>
    </form>
  )
}
