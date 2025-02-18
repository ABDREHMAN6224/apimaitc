export interface Task  {
  id: string;
  title: string;
  updated: Date;
  due: Date | null;
  completed: string;
};