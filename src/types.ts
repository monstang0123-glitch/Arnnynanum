import { Timestamp } from 'firebase/firestore';

export interface Book {
  id?: string;
  title: string;
  author: string;
  genre: string;
  description?: string;
  coverUrl?: string;
  addedBy: string;
  addedByName?: string;
  createdAt: Timestamp | Date;
}

export interface Like {
  id?: string;
  userId: string;
  bookId: string;
}

export type Genre = 
  | 'นิยาย' 
  | 'วิชาการ/สารคดี' 
  | 'สืบสวนสอบสวน' 
  | 'ไซไฟ/แฟนตาซี' 
  | 'ประวัติศาสตร์' 
  | 'จิตวิทยา/พัฒนาตนเอง' 
  | 'ธุรกิจ/การเงิน' 
  | 'การ์ตูน/มังงะ' 
  | 'อื่นๆ';

export const GENRES: Genre[] = [
  'นิยาย',
  'วิชาการ/สารคดี',
  'สืบสวนสอบสวน',
  'ไซไฟ/แฟนตาซี',
  'ประวัติศาสตร์',
  'จิตวิทยา/พัฒนาตนเอง',
  'ธุรกิจ/การเงิน',
  'การ์ตูน/มังงะ',
  'อื่นๆ'
];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
