import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

export default function DeleteConfirmModal({ open, onOpenChange, onConfirm, clientName }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        data-testid="delete-confirm-modal"
        className="bg-[#1e2130] border border-[#2e3245] text-white"
      >
        <AlertDialogHeader>
          <div className="h-11 w-11 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/25 grid place-items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-[#ef4444]" />
          </div>
          <AlertDialogTitle
            className="text-xl text-white tracking-tight"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Delete {clientName ? `“${clientName}”` : "client"}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#94a3b8]">
            Are you sure? This cannot be undone. All settings for this client will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            data-testid="delete-cancel-btn"
            className="bg-transparent border-[#2e3245] text-white hover:bg-[#1a1d27] hover:text-white"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="delete-confirm-btn"
            onClick={onConfirm}
            className="bg-[#ef4444] hover:bg-[#dc2626] text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]"
          >
            Delete client
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
