export interface CurriculumCourse {
  stt: number;
  code: string;
  name: string;
  specialization?: string;
  credits: number;
  required: boolean;
  completed: boolean;
  totalHours: number;
  theoryHours: number;
  practiceHours: number;
}

export interface CurriculumSemester {
  semesterId: number;
  semesterName: string; // e.g. "Học kỳ 1 - Năm học 2023 - 2024"
  totalCredits: number; // e.g. 20.5
  courses: CurriculumCourse[];
}

export interface CurriculumPlan {
  majorCode: string;     // "7520207"
  majorName: string;     // "Kỹ thuật Điện tử Viễn thông"
  facultyName: string;   // "Khoa Viễn thông 1"
  degreeType: string;    // "Kỹ sư"
  totalCredits: number;  // 150
  trainingTime: string;  // "4.5 năm (9 học kỳ tín chỉ)"
  cohort: string;        // "Khóa D23 (2023 - 2027)"
  semesters: CurriculumSemester[];
}
