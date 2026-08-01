"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { SppgProfile } from "@/lib/types";

interface RegisterInput {
  namaSppg: string;
  wilayah: string;
  penanggungJawab: string;
  telepon: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  profile: SppgProfile | null;
  initializing: boolean;
  profileLoading: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SppgProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
      if (!u) {
        setProfile(null);
        setProfileLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marks profile as loading again when the signed-in user changes
    setProfileLoading(true);
    const ref = doc(db, "sppgProfiles", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setProfile(snap.exists() ? (snap.data() as SppgProfile) : null);
        setProfileLoading(false);
      },
      () => setProfileLoading(false)
    );
    return unsub;
  }, [user]);

  async function register(input: RegisterInput) {
    const cred = await createUserWithEmailAndPassword(
      auth,
      input.email,
      input.password
    );
    await updateProfile(cred.user, { displayName: input.namaSppg });

    const profileData: SppgProfile = {
      uid: cred.user.uid,
      namaSppg: input.namaSppg,
      wilayah: input.wilayah,
      penanggungJawab: input.penanggungJawab,
      telepon: input.telepon,
      email: input.email,
      role: "sppg",
      status: "pending",
      createdAt: Date.now(),
    };

    await setDoc(doc(db, "sppgProfiles", cred.user.uid), profileData);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, initializing, profileLoading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
