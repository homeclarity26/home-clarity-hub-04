import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface EditModeContextType {
  editMode: boolean;
  toggleEditMode: () => void;
  canEdit: boolean;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

export const useEditMode = () => {
  const context = useContext(EditModeContext);
  if (!context) {
    throw new Error("useEditMode must be used within an EditModeProvider");
  }
  return context;
};

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const { isCreator } = useAuth();
  const [editMode, setEditMode] = useState(false);

  const toggleEditMode = () => {
    if (isCreator) {
      setEditMode((prev) => !prev);
    }
  };

  // Only creators can edit
  const canEdit = isCreator && editMode;

  return (
    <EditModeContext.Provider value={{ editMode, toggleEditMode, canEdit }}>
      {children}
    </EditModeContext.Provider>
  );
};
