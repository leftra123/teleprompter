export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type View = 'prompter' | 'scripts' | 'editor';
