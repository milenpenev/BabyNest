import type { Memory, MemoryAlbum, MemoryMedia } from "../model/memory.types";
export interface MemorySnapshot { memories: Memory[]; albums: MemoryAlbum[]; dismissedAutomaticKeys: string[]; }
export interface MemoryRepository { load(familyId: string): Promise<MemorySnapshot | null>; save(familyId: string, snapshot: MemorySnapshot): Promise<void>; subscribe?(familyId: string, listener: (snapshot: MemorySnapshot) => void): () => void; }
export interface MemoryMediaStorage { saveLocal(file: File): Promise<MemoryMedia>; upload?(media: MemoryMedia, familyId: string, babyId: string): Promise<MemoryMedia>; remove(media: MemoryMedia): Promise<void>; }
export interface PrintedBookProvider { createOrder(bookId: string, options: Record<string,string|number>): Promise<{ orderId: string }>; }
