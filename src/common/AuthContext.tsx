
import React, { createContext, useState, useEffect, ReactNode, useContext } from "react";
import axios from "axios";

// Define user and permissions structure
interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
}

interface Permissions {
  [key: string]: boolean; // Example: { "reminder.create": true, "lead.update": false }
}

// Context state types
interface AuthContextType {
  user: User | null;
  permissions: Permissions;

}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchPermissions(parsedUser.role_id);
    }
  }, []);

  const fetchPermissions = async (roleId: number) => {
    try {
      const { data } = await axios.get<Permissions>(`http://localhost:5000/permissions/${roleId}`);
      setPermissions(data);
    } catch (err) {
      console.error("Failed to fetch permissions", err);
    }
  };
  return (
    <AuthContext.Provider value={{ user, permissions }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
