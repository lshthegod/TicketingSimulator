export interface User {
    id: string;
    nickname: string;
    isDummy: boolean;
    role: 'USER' | 'ADMIN';
    createdAt: Date;
  }
  