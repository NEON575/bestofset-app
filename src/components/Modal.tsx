"use client";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  show: boolean;
  maxWidth?: string;
  children: React.ReactNode;
}

/** Bütün modalların ortaq açılma/bağlanma animasiyası (scale+fade). Davranışı dəyişmir — yalnız görünüşü. */
export default function Modal({ show, maxWidth = "max-w-2xl", children }: ModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-start justify-center p-8 overflow-y-auto z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={`card w-full ${maxWidth} p-6`}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
