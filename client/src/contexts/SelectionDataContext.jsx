import { createContext, useContext, useState } from 'react';
import { selectionData as initialData } from '../mock/selectionData';

const SelectionDataContext = createContext(null);

export function SelectionDataProvider({ children }) {
  const [rows, setRows] = useState(initialData);

  return (
    <SelectionDataContext.Provider value={{ rows, setRows }}>
      {children}
    </SelectionDataContext.Provider>
  );
}

export function useSelectionData() {
  const ctx = useContext(SelectionDataContext);
  if (!ctx) throw new Error('useSelectionData must be used within SelectionDataProvider');
  return ctx;
}
