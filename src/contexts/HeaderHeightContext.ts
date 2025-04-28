import { createContext, ReactNode } from 'react';

export const HeaderHeightContext = createContext<number>(108);

export const HeaderHeightProvider = HeaderHeightContext.Provider; 