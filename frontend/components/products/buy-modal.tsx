"use client"

import { useState } from 'react'
import Image from 'next/image'
import type { Product } from '@/lib/types'
import { formatPrice } from '@/lib/mock-data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Minus, Plus, ShoppingCart } from 'lucide-react'

interface BuyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  onConfirm: (quantity: number) => void
}

export function BuyModal({ open, onOpenChange, product, onConfirm }: BuyModalProps) {
  const [quantity, setQuantity] = useState(1)

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity)
    }
  }

  const handleConfirm = () => {
    onConfirm(quantity)
    setQuantity(1)
  }

  const totalPrice = (product.buyPrice || 0) * quantity

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Mua ngay</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4">
          <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-secondary shrink-0">
            <Image
              src={product.mainImageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium line-clamp-2">{product.name}</h3>
            <p className="text-primary font-semibold mt-1">
              {formatPrice(product.buyPrice || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Con {product.stock} san pham
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>So luong</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-20 text-center rounded-xl"
                min={1}
                max={product.stock}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
            <span className="text-sm text-muted-foreground">Tong cong:</span>
            <span className="text-lg font-semibold text-primary">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Huy
          </Button>
          <Button onClick={handleConfirm} className="rounded-full">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Them vao gio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
