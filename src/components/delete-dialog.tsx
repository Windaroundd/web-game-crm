"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  requireConfirmation?: boolean;
  isLoading?: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  requireConfirmation = false,
  isLoading = false,
}: DeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  
  const isConfirmed = !requireConfirmation || 
    (itemName && confirmText.toLowerCase() === itemName.toLowerCase());

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setConfirmText("");
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setConfirmText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <IconAlertTriangle className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {requireConfirmation && itemName && (
          <div className="space-y-2">
            <Label htmlFor="confirm-text">
              Type <strong>{itemName}</strong> to confirm:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={itemName}
              autoComplete="off"
            />
          </div>
        )}
        
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
          >
            <IconTrash className="h-4 w-4 mr-2" />
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bulk delete dialog
interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  count: number;
  itemType: string;
  isLoading?: boolean;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  count,
  itemType,
  isLoading = false,
}: BulkDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <IconAlertTriangle className="h-5 w-5" />
            Delete {count} {itemType}{count !== 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription className="text-left">
            Are you sure you want to delete {count} {itemType}{count !== 1 ? 's' : ''}? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            <IconTrash className="h-4 w-4 mr-2" />
            {isLoading ? "Deleting..." : `Delete ${count} ${itemType}${count !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}