// "use client";

// import { useEffect, useRef, type ReactNode } from "react";
// import { X } from "lucide-react";

// type Props = { title: string; onClose: () => void; children: ReactNode };

// export function Modal({ title, onClose, children }: Props) {
//   // a ref is a handle to the real <dialog> element in the page
//   const dialogRef = useRef<HTMLDialogElement>(null);

//   useEffect(() => {
//     const dialog = dialogRef.current;
//     // showModal() opens it as a true modal. In development React runs effects
//     // twice, and opening an already-open dialog would throw, so we check first.
//     if (dialog && !dialog.open) dialog.showModal();
//   }, []);

//   return (
//     <dialog
//       ref={dialogRef}
//       aria-label={title}
//       onClose={onClose} // the browser fires this when the user presses Escape
//       onClick={(event) => {
//         // clicks on the dark backdrop land on the <dialog> element itself
//         if (event.target === dialogRef.current) onClose();
//       }}
//       className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-navy-900 shadow-xl backdrop:bg-navy-950/50"
//     >
//       <div className="max-h-[90vh] overflow-y-auto p-6">
//         <div className="mb-4 flex items-center justify-between">
//           <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
//           <button
//             onClick={onClose}
//             aria-label="Close"
//             className="text-navy-500 hover:text-navy-900"
//           >
//             <X className="size-5" />
//           </button>
//         </div>
//         {children}
//       </div>
//     </dialog>
//   );
// }


// "use client";

// import type { ReactNode } from "react";
// import { X } from "lucide-react";

// type Props = { title: string; onClose: () => void; children: ReactNode };

// export function Modal({ title, onClose, children }: Props) {
//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4"
//       onClick={onClose}
//     >
//       {/* stopPropagation: clicks INSIDE the white box must not reach the background */}
//       <div
//         className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="mb-4 flex items-center justify-between">
//           <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
//           <button onClick={onClose} aria-label="Close" className="text-navy-500 hover:text-navy-900">
//             <X className="size-5" />
//           </button>
//         </div>
//         {children}
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "xl";
};

export function Modal({
  title,
  onClose,
  children,
  size = "md",
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
      className={`m-auto w-[calc(100%-2rem)] ${
        size === "xl" ? "max-w-5xl" : "max-w-md"
      } rounded-xl bg-white p-0 text-navy-900 shadow-xl backdrop:bg-navy-950/50`}
    >
      <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-navy-500 transition hover:bg-navy-50 hover:text-navy-900"
          >
            <X className="size-5" />
          </button>
        </div>

        {children}
      </div>
    </dialog>
  );
}