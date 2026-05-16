// ─── Types ────────────────────────────────────────────────────────────────────

// Genre is a "union type" — it means the value can ONLY be one of these four
// strings. TypeScript will show an error if you accidentally write e.g. "rock"
// (lowercase) instead of "Rock".
export type Genre = "Rock" | "Jazz" | "Hip-Hop" | "Electronic";

// GenreOption extends Genre with "All", which is used in the filter UI
// to represent "show every genre".
export type GenreOption = "All" | Genre;

// Album describes the shape of a single album object.
// Using an interface means every album in the array MUST have all these fields
// with the correct types — TypeScript will catch typos at compile time.
export interface Album {
  id: string;          // Unique identifier, used as the React list key
  title: string;       // Album title shown on the card
  artist: string;      // Artist name shown below the title
  genre: Genre;        // Must be one of the four Genre values above
  price: number;       // Stored as a raw number, formatted to 2 dp in the UI
  imageUrl: string;    // Full URL — we use picsum.photos for placeholder art
  previewUrl: string;  // Placeholder path for a future audio preview feature
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// This is our fake "database" for now. When we add a real backend later,
// this file will be replaced by an API call — nothing else needs to change
// because all components just accept `Album[]`, regardless of where it comes from.
//
// Genres are interleaved (Rock, Jazz, Hip-Hop, Electronic, repeat) so the grid
// looks visually varied instead of showing all Rock cards in a row.
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
