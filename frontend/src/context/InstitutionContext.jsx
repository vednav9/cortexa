import { createContext, useContext } from "react";

export const InstitutionContext = createContext(null);

export const useInstitution = () => useContext(InstitutionContext);
