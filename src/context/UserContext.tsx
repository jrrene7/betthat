import { createContext, useContext, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "src/utils/trpc";

interface UserData {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  balance: number;
}

interface UserContextValue {
  user: UserData | null | undefined;
  isLoading: boolean;
  refetchUser: () => void;
  isEditOpen: boolean;
  openEdit: () => void;
  closeEdit: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.user.getMe.useQuery(undefined, {
    enabled: !!session?.user,
  });

  return (
    <UserContext.Provider
      value={{
        user: data?.user,
        isLoading,
        refetchUser: refetch,
        isEditOpen,
        openEdit: () => setIsEditOpen(true),
        closeEdit: () => setIsEditOpen(false),
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
