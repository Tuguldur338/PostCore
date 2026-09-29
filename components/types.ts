export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role?: "admin" | "student";
  image?: string;
  deliveryAddress?: DeliveryAddress;
};

export type DeliveryAddress = {
  recipient: string;
  street: string;
  apartment: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  instructions: string;
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
