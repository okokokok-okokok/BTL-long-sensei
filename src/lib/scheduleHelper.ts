import { CourseItem } from '@/types/student';

export interface WeekGridItem {
  courseCode: string;
  courseName: string;
  groupName: string;
  room: string;
  instructor: string;
  dayOfWeek: number; // 2 = Thứ 2, 3 = Thứ 3, ..., 7 = Thứ 7, 8 = Chủ nhật
  startPeriod: number; // 1 to 12
  periodSpan: number; // e.g. 2 or 3
  colorClass?: string;
}

export const PERIOD_TIMES: Record<number, string> = {
  1: '07:00 - 07:50',
  2: '08:00 - 08:50',
  3: '09:00 - 09:50',
  4: '10:00 - 10:50',
  5: '11:00 - 11:50',
  6: '12:00 - 12:50',
  7: '13:00 - 13:50',
  8: '14:00 - 14:50',
  9: '15:00 - 15:50',
  10: '16:00 - 16:50',
  11: '17:00 - 17:50',
  12: '18:00 - 18:50',
};

// Course time schedule definition
export const COURSE_SCHEDULE_MAP: Record<string, { dayOfWeek: number; startPeriod: number; periodSpan: number; room: string; groupName: string; color: string }> = {
  INT1306: {
    dayOfWeek: 2, // Thứ 2
    startPeriod: 2,
    periodSpan: 2, // Tiết 2-3
    room: '301-A2',
    groupName: 'D23CQVT04-B',
    color: 'bg-blue-100/90 dark:bg-blue-950/80 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200',
  },
  INT3306: {
    dayOfWeek: 2, // Thứ 2
    startPeriod: 4,
    periodSpan: 2, // Tiết 4-5
    room: 'Lab 2-A3',
    groupName: 'D23CQVT04-B',
    color: 'bg-indigo-100/90 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200',
  },
  INT1402: {
    dayOfWeek: 3, // Thứ 3
    startPeriod: 7,
    periodSpan: 3, // Tiết 7-9 (13:00 - 15:40)
    room: '405-A2',
    groupName: 'D23CQVT04-B',
    color: 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200',
  },
  INT3401: {
    dayOfWeek: 4, // Thứ 4
    startPeriod: 7,
    periodSpan: 3, // Tiết 7-9
    room: '202-A2',
    groupName: 'D23CQVT04-B',
    color: 'bg-emerald-100/90 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200',
  },
  INT3502: {
    dayOfWeek: 5, // Thứ 5
    startPeriod: 2,
    periodSpan: 3, // Tiết 2-4 (08:00 - 10:40)
    room: '105-A3',
    groupName: 'D23CQVT04-B',
    color: 'bg-purple-100/90 dark:bg-purple-950/80 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-200',
  },
  BAS1224: {
    dayOfWeek: 6, // Thứ 6
    startPeriod: 2,
    periodSpan: 3, // Tiết 2-4
    room: 'PM.03-A2',
    groupName: 'D23CQVT04-B',
    color: 'bg-rose-100/90 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200',
  },
  INT1339: {
    dayOfWeek: 7, // Thứ 7
    startPeriod: 7,
    periodSpan: 3, // Tiết 7-9
    room: 'Lab Mạng-A3',
    groupName: 'D23CQVT04-B',
    color: 'bg-cyan-100/90 dark:bg-cyan-950/80 border-cyan-300 dark:border-cyan-800 text-cyan-950 dark:text-cyan-200',
  },
};

/**
 * Generate grid items from currently registered courses of the student
 */
export function getStudentWeekSchedule(courses: CourseItem[]): WeekGridItem[] {
  const registered = courses.filter((c) => c.status === 'registered');

  return registered.map((course) => {
    const config = COURSE_SCHEDULE_MAP[course.code] || {
      dayOfWeek: 2,
      startPeriod: 1,
      periodSpan: 2,
      room: course.room || 'Phòng 201-A2',
      groupName: 'D23CQVT04-B',
      color: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100',
    };

    return {
      courseCode: course.code,
      courseName: course.name,
      groupName: config.groupName,
      room: config.room || course.room,
      instructor: course.instructor,
      dayOfWeek: config.dayOfWeek,
      startPeriod: config.startPeriod,
      periodSpan: config.periodSpan,
      colorClass: config.color,
    };
  });
}
