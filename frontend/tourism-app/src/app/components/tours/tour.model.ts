export enum TourDifficulty {
  Easy = 'EASY',
  Medium = 'MEDIUM',
  Hard = 'HARD'
}

export enum TourStatus {
  Draft = 'DRAFT',
  Published = 'PUBLISHED',
  Archived = 'ARCHIVED'
}

export interface KeyPoint {
  id?: number;
  tourId?: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  order?: number;
}

export interface Review {
  id?: number;
  tourId: number;
  touristId?: number;
  touristName?: string;
  touristImage?: string;
  rating: number;
  comment: string;
  visitDate: string;
  createdAt?: string;
  images?: string[];
}

export interface Tour {
  id?: number;
  authorId?: number;
  name: string;
  description: string;
  difficulty: TourDifficulty;
  tags: string[];
  status: TourStatus;
  price: number;
  lengthKm?: number;
  keyPoints?: KeyPoint[];
  reviews?: Review[];
  createdAt?: string;
}

export interface TourCreateDto {
  name: string;
  description: string;
  difficulty: TourDifficulty;
  tags: string[];
}