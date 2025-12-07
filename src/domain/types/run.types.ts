export type RunStatus = 'SCHEDULED' | 'ONGOING' | 'FINISHED' | 'CANCELLED';
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';

export interface Run { 
    id: string; 
    ownerUserId: string; 
    name: string; 
    startsAt: Date; 
    status: RunStatus; 
    difficulty: Difficulty; 
    maxSeats: number; 
    dummyRatio: number; 
    createdAt: Date; 
}