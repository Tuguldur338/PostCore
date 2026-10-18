export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "marketplace_admin" | "student";
  image?: string;
};

export type AuthMode = "login" | "register";

export type Product = {
  id: string;
  name: string;
  price: string;
  badge: string;
  description: string;
  image: string;
  category: string;
  fitsFor: string;
  pickupClass?: string;
  pickupRoom?: string;
  pickupMethod?: string;
  sellerEmail?: string;
  quantity?: number;
  outOfStock?: boolean;
};

export type AuthForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};
