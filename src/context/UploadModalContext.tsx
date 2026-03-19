import { createContext, useContext, useState } from "react";

interface UploadModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const UploadModalContext = createContext<UploadModalContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function UploadModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <UploadModalContext.Provider
      value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}
    >
      {children}
    </UploadModalContext.Provider>
  );
}

export function useUploadModal() {
  return useContext(UploadModalContext);
}
