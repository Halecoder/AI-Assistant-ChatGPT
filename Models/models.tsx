export type Message = {
  nickname: string;
  timestamp: number;
  message: string;
  isPull: boolean;
  isSkip?:boolean
};
