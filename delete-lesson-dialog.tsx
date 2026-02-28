/**
 * Delete Lesson Dialog
 * 
 * Confirmation dialog for deleting lessons.
 * Follows "effortless" philosophy: minimal confirmation, auto-backup, undo option.
 * Apple Orchard Design System with warm farmhouse aesthetics.
 */

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Trash2, AlertTriangle, Apple } from 'lucide-react';

interface DeleteLessonDialogProps {
  isOpen: boolean;
  lessonName: string;
  lessonId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteLessonDialog({
  isOpen,
  lessonName,
  lessonId,
  onConfirm,
  onCancel,
}: DeleteLessonDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="bg-[#FFF6E9]">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="bg-[#C84C4C]/10 p-3 rounded-lg border-2 border-[#C84C4C]/20">
              <Trash2 className="size-6 text-[#C84C4C]" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-[#1F2A44] text-xl">Delete Lesson?</AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-[#1F2A44]/70">
                This will delete <span className="font-semibold text-[#1F2A44]">"{lessonName}"</span>
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="bg-[#6FA86B]/10 border-2 border-[#6FA86B]/30 rounded-lg p-4 flex gap-3 text-sm">
          <Apple className="size-5 text-[#6FA86B] mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-[#1F2A44]">Don't worry - we've got you covered</p>
            <p className="mt-1 text-[#1F2A44]/70">A backup is saved automatically. You can restore this lesson from the recovery tool if needed.</p>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={isDeleting}
            className="border-[#1F2A44]/20 hover:bg-[#1F2A44]/5"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-[#C84C4C] hover:bg-[#C84C4C]/90 text-white focus:ring-[#C84C4C]"
          >
            {isDeleting ? 'Deleting...' : 'Delete Lesson'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}