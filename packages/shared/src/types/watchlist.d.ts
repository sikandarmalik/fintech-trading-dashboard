export interface WatchlistDTO {
    id: string;
    userId: string;
    name: string;
    items: WatchlistItemDTO[];
    createdAt: Date;
    updatedAt: Date;
}
export interface WatchlistItemDTO {
    id: string;
    watchlistId: string;
    symbol: string;
    createdAt: Date;
}
export interface CreateWatchlistDTO {
    name: string;
}
export interface AddWatchlistItemDTO {
    symbol: string;
}
