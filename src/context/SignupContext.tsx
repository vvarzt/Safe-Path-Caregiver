import React, { createContext, useContext, useState } from "react";

type SignupData = {
  uid?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: Date | null;
  email?: string;
  password?: string;
  phone?: string;
  image?: string | null;

  address?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  zipcode?: string;

  idCard?: string | null;
  house?: string | null;
  certificate?: string | null;
  bank?: string;
  accountNumber?: string;
  bookBank?: string | null;
  contactName?: string;
  relation?: string;
  contactPhone?: string;

  role?: string;

  isApproved?: boolean;

  // ✅ เพิ่มอันนี้
  status?: string;
};

type SignupContextType = {
  data: SignupData;
  setData: React.Dispatch<React.SetStateAction<SignupData>>;
};

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export const SignupProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<SignupData>({});

  return (
    <SignupContext.Provider value={{ data, setData }}>
      {children}
    </SignupContext.Provider>
  );
};

export const useSignup = () => {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error("useSignup must be used within SignupProvider");
  }
  return context;
};
