export type Genre = "Rock" | "Jazz" | "Hip-Hop" | "Electronic";

export interface Product {
  id: string;
  title: string;
  artist: string;
  genre: Genre;
  price: number;
  salePrice?: number | null;
  stock: number;
  imageUrl: string;
  previewUrl: string;
}

export const products: Product[] = [
  { id: "1",  title: "Neon Horizon",    artist: "The Static Kings",  genre: "Rock",       price: 9.99,  stock: 42, imageUrl: "https://picsum.photos/seed/1/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "2",  title: "Midnight Smoke",  artist: "Ella Voss Quartet", genre: "Jazz",       price: 11.99, stock: 18, imageUrl: "https://picsum.photos/seed/2/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "3",  title: "Street Echoes",   artist: "Cypher Bloc",       genre: "Hip-Hop",    price: 8.99,  stock: 67, imageUrl: "https://picsum.photos/seed/3/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "4",  title: "Pulse Drive",     artist: "Axiom Circuit",     genre: "Electronic", price: 12.99, stock: 5,  imageUrl: "https://picsum.photos/seed/4/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "5",  title: "Broken Strings",  artist: "Vault Road",        genre: "Rock",       price: 10.99, stock: 31, imageUrl: "https://picsum.photos/seed/5/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "6",  title: "Blue Canvas",     artist: "Marcus DeLeon",     genre: "Jazz",       price: 13.99, stock: 0,  imageUrl: "https://picsum.photos/seed/6/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "7",  title: "Crown Frequency", artist: "Lyric Temple",      genre: "Hip-Hop",    price: 9.49,  stock: 24, imageUrl: "https://picsum.photos/seed/7/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "8",  title: "Void Signal",     artist: "Phase Shift",       genre: "Electronic", price: 14.99, stock: 11, imageUrl: "https://picsum.photos/seed/8/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "9",  title: "Red Amplifier",   artist: "The Hollow Ground", genre: "Rock",       price: 7.99,  stock: 3,  imageUrl: "https://picsum.photos/seed/9/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "10", title: "Autumn Sessions", artist: "Nadia Crane",       genre: "Jazz",       price: 10.49, stock: 59, imageUrl: "https://picsum.photos/seed/10/400/400", previewUrl: "/preview-placeholder.mp3" },
  { id: "11", title: "Concrete Bloom",  artist: "Orion Verbal",      genre: "Hip-Hop",    price: 11.49, stock: 14, imageUrl: "https://picsum.photos/seed/11/400/400", previewUrl: "/preview-placeholder.mp3" },
  { id: "12", title: "Grid Pattern",    artist: "Synthex Wave",      genre: "Electronic", price: 13.49, stock: 88, imageUrl: "https://picsum.photos/seed/12/400/400", previewUrl: "/preview-placeholder.mp3" },
];

export type OrderStatus = "pending" | "completed" | "refunded";

export interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  amount: number;
  status: OrderStatus;
  date: string;
}

export const orders: Order[] = [
  { id: "ORD-001", customer: "Priya Mehta",     email: "priya@example.com",   product: "Neon Horizon",    amount: 9.99,  status: "completed", date: "2026-05-14" },
  { id: "ORD-002", customer: "James O'Brien",   email: "james@example.com",   product: "Pulse Drive",     amount: 12.99, status: "completed", date: "2026-05-14" },
  { id: "ORD-003", customer: "Sofia Almeida",   email: "sofia@example.com",   product: "Blue Canvas",     amount: 13.99, status: "pending",   date: "2026-05-15" },
  { id: "ORD-004", customer: "Noah Tanaka",     email: "noah@example.com",    product: "Void Signal",     amount: 14.99, status: "pending",   date: "2026-05-15" },
  { id: "ORD-005", customer: "Aisha Okafor",    email: "aisha@example.com",   product: "Street Echoes",   amount: 8.99,  status: "refunded",  date: "2026-05-13" },
  { id: "ORD-006", customer: "Luca Ferrari",    email: "luca@example.com",    product: "Crown Frequency", amount: 9.49,  status: "completed", date: "2026-05-12" },
  { id: "ORD-007", customer: "Mia Johansson",   email: "mia@example.com",     product: "Broken Strings",  amount: 10.99, status: "completed", date: "2026-05-11" },
  { id: "ORD-008", customer: "Carlos Ruiz",     email: "carlos@example.com",  product: "Red Amplifier",   amount: 7.99,  status: "pending",   date: "2026-05-16" },
  { id: "ORD-009", customer: "Yuki Nakamura",   email: "yuki@example.com",    product: "Autumn Sessions", amount: 10.49, status: "completed", date: "2026-05-10" },
  { id: "ORD-010", customer: "Grace Kimani",    email: "grace@example.com",   product: "Grid Pattern",    amount: 13.49, status: "refunded",  date: "2026-05-09" },
];
