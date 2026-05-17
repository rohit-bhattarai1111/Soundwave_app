// TODO iteration 2: replace with database query

export type Genre = "Rock" | "Jazz" | "Hip-Hop" | "Electronic";
export type GenreOption = "All" | Genre;

export interface Album {
  id: string;
  title: string;
  artist: string;
  genre: Genre;
  price: number;
  imageUrl: string;
  previewUrl: string;
}

export const albums: Album[] = [
  { id: "1",  title: "Neon Horizon",    artist: "The Static Kings",  genre: "Rock",       price: 9.99,  imageUrl: "https://picsum.photos/seed/1/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "2",  title: "Midnight Smoke",  artist: "Ella Voss Quartet", genre: "Jazz",       price: 11.99, imageUrl: "https://picsum.photos/seed/2/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "3",  title: "Street Echoes",   artist: "Cypher Bloc",       genre: "Hip-Hop",    price: 8.99,  imageUrl: "https://picsum.photos/seed/3/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "4",  title: "Pulse Drive",     artist: "Axiom Circuit",     genre: "Electronic", price: 12.99, imageUrl: "https://picsum.photos/seed/4/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "5",  title: "Broken Strings",  artist: "Vault Road",        genre: "Rock",       price: 10.99, imageUrl: "https://picsum.photos/seed/5/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "6",  title: "Blue Canvas",     artist: "Marcus DeLeon",     genre: "Jazz",       price: 13.99, imageUrl: "https://picsum.photos/seed/6/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "7",  title: "Crown Frequency", artist: "Lyric Temple",      genre: "Hip-Hop",    price: 9.49,  imageUrl: "https://picsum.photos/seed/7/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "8",  title: "Void Signal",     artist: "Phase Shift",       genre: "Electronic", price: 14.99, imageUrl: "https://picsum.photos/seed/8/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "9",  title: "Red Amplifier",   artist: "The Hollow Ground", genre: "Rock",       price: 7.99,  imageUrl: "https://picsum.photos/seed/9/400/400",  previewUrl: "/preview-placeholder.mp3" },
  { id: "10", title: "Autumn Sessions", artist: "Nadia Crane",       genre: "Jazz",       price: 10.49, imageUrl: "https://picsum.photos/seed/10/400/400", previewUrl: "/preview-placeholder.mp3" },
  { id: "11", title: "Concrete Bloom",  artist: "Orion Verbal",      genre: "Hip-Hop",    price: 11.49, imageUrl: "https://picsum.photos/seed/11/400/400", previewUrl: "/preview-placeholder.mp3" },
  { id: "12", title: "Grid Pattern",    artist: "Synthex Wave",      genre: "Electronic", price: 13.49, imageUrl: "https://picsum.photos/seed/12/400/400", previewUrl: "/preview-placeholder.mp3" },
];
