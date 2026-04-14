"use client"

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '@/lib/types'

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, type: 'buy' | 'rent', quantity?: number, rentDateRange?: { start: string; end: string }) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  updateRentDates: (itemId: string, dateRange: { start: string; end: string }) => void
  clearCart: () => void
  totalItems: number
  selectedItems: string[]
  toggleItemSelection: (itemId: string) => void
  selectAll: () => void
  deselectAll: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const addItem = (
    product: Product, 
    type: 'buy' | 'rent', 
    quantity = 1, 
    rentDateRange?: { start: string; end: string }
  ) => {
    const newItem: CartItem = {
      id: `${product.id}-${type}-${Date.now()}`,
      product,
      quantity,
      type,
      rentDateRange,
      addedAt: new Date().toISOString().split('T')[0]
    }
    setItems(prev => [...prev, newItem])
  }

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
    setSelectedItems(prev => prev.filter(id => id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
    ))
  }

  const updateRentDates = (itemId: string, dateRange: { start: string; end: string }) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, rentDateRange: dateRange } : item
    ))
  }

  const clearCart = () => {
    setItems([])
    setSelectedItems([])
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const selectAll = () => {
    setSelectedItems(items.map(item => item.id))
  }

  const deselectAll = () => {
    setSelectedItems([])
  }

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      updateRentDates,
      clearCart,
      totalItems: items.length,
      selectedItems,
      toggleItemSelection,
      selectAll,
      deselectAll
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
