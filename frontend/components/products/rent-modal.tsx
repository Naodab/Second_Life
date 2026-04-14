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
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, ShoppingCart } from 'lucide-react'
import { format, differenceInDays, addDays } from 'date-fns'
import type { DateRange } from 'react-day-picker'

interface RentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  onConfirm: (dateRange: { start: string; end: string }) => void
}

export function RentModal({ open, onOpenChange, product, onConfirm }: RentModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), 1),
    to: addDays(new Date(), 3)
  })

  const handleConfirm = () => {
    if (dateRange?.from && dateRange?.to) {
      onConfirm({
        start: format(dateRange.from, 'yyyy-MM-dd'),
        end: format(dateRange.to, 'yyyy-MM-dd')
      })
      setDateRange(undefined)
    }
  }

  const rentalDays = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1
    : 0

  const totalPrice = (product.rentPrice || 0) * rentalDays

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Thue ngay</DialogTitle>
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
              {formatPrice(product.rentPrice || 0)}/ngay
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Con {product.stock} san pham
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Chon thoi gian thue</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal rounded-xl"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yyyy')} - {format(dateRange.to, 'dd/MM/yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    <span className="text-muted-foreground">Chon khoang ngay</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {rentalDays > 0 && (
            <div className="p-4 rounded-xl bg-secondary space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Thoi gian:</span>
                <span>{rentalDays} ngay</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Gia thue/ngay:</span>
                <span>{formatPrice(product.rentPrice || 0)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-medium">Tong cong:</span>
                <span className="text-lg font-semibold text-primary">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
            Huy
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="rounded-full"
            disabled={!dateRange?.from || !dateRange?.to}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Them vao gio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
