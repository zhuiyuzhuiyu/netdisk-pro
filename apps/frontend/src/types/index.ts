export type DriveItem = {
  id: string;
  name: string;
  type: 'FILE' | 'FOLDER';
  parentId: string | null;
  size: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShareLink = {
  id: string;
  token: string;
  passwordHash: string | null;
  expiresAt: string | null;
  createdAt: string;
};
