export type Schedule = {
  id: number;
  name: string;
  start_time: string; 
  end_time: string;
  break_minutes: number;
  grace_minutes: number;
  workdays: number[];
};

export type ScheduleInput = {
  name: string;
  start_time: string; // "09:00" from <input type="time">
  end_time: string;
  break_minutes: number;
  grace_minutes: number;
  workdays: number[];
};