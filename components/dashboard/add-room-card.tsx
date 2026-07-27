"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { useI18n } from "@/components/i18n-provider"
import { createRoom } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function AddRoomCard() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [roomNumber, setRoomNumber] = useState("")
  const [targetPrice, setTargetPrice] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = Number(targetPrice)
    if (!roomNumber.trim() || !price || price <= 0) {
      toast.error("Enter a room number and a valid target price")
      return
    }
    startTransition(async () => {
      const result = await createRoom({ roomNumber: roomNumber.trim(), targetPrice: price })
      if (!result.ok) {
        toast.error(t("roomExistsError"))
        return
      }
      toast.success(t("roomCreatedToast"))
      setRoomNumber("")
      setTargetPrice("")
      setOpen(false)
    })
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-left">
        <Card className="h-full border-dashed transition-shadow hover:shadow-md">
          <CardContent className="flex h-full flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <Plus className="size-5" />
            <span className="text-sm font-medium">{t("addRoom")}</span>
          </CardContent>
        </Card>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader className="border-b">
            <SheetTitle>{t("addRoomTitle")}</SheetTitle>
            <SheetDescription>{t("addRoomDesc")}</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 pb-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-room-number">{t("roomNumberField")}</Label>
              <Input
                id="new-room-number"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 205"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-room-price">{t("targetPriceField")}</Label>
              <Input
                id="new-room-price"
                type="number"
                min="0"
                step="1"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {t("createRoomAction")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
