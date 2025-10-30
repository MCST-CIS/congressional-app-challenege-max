
import { initializeApp, getApps, getApp } from 'firebase/app';

const firebaseConfig = {
  projectId: "studio-9264954351-8788a",
  appId: "1:237836670939:web:3e06b298478e17260039fe",
  apiKey: "AIzaSyANwyto6Q_0ZORz-o68SE3hEq2Ly9_3EQg",
  authDomain: "studio-9264954351-8788a.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "237836670939"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
