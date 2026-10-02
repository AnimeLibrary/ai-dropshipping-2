'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

export interface CartItem {
  id: string // `${productId}_${variantId || 'default'}`
  productId: string
  variantId?: string | null
  vid?: string | null
  title: string
  variantLabel?: string | null
  price: number
  image?: string | null
  quantity: number
  slug?: string
  supplierUrl?: string | null
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, delta: number) => void
  setQuantity: (id: string, qty: number) => void
  clearCart: () => void
  totalCount: number
  subtotal: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = 'vexsen_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  // Persist cart to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e)
    }
  }, [items, isHydrated])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.id === item.id)
      if (existingIdx > -1) {
        const next = [...prev]
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: Math.min(10, next[existingIdx].quantity + qty)
        }
        return next
      }
      return [...prev, { ...item, quantity: Math.max(1, Math.min(10, qty)) }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems(prev =>
      prev
        .map(i => {
          if (i.id === id) {
            const nextQty = i.quantity + delta
            return nextQty > 0 ? { ...i, quantity: Math.min(10, nextQty) } : null
          }
          return i
        })
        .filter((i): i is CartItem => i !== null)
    )
  }, [])

  const setQuantity = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id)
      return
    }
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity: Math.min(10, qty) } : i))
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [])

  const totalCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0)
  }, [items])

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  }, [items])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      setQuantity,
      clearCart,
      totalCount,
      subtotal,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
    }),
    [items, addItem, removeItem, updateQuantity, setQuantity, clearCart, totalCount, subtotal, isOpen, openCart, closeCart, toggleCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
