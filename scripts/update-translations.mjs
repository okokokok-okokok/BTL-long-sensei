import fs from 'fs';

const filePath = 'src/lib/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. VI replacements
content = content.replace("majorValue: 'Công nghệ thông tin',", "majorValue: 'Kỹ thuật Điện tử Viễn thông',");
content = content.replace("facultyValue: 'Khoa Công nghệ thông tin 1',", "facultyValue: 'Khoa Viễn thông 1',");
content = content.replace(
  "navCourses: 'Khóa học',",
  "navCourses: 'Đăng ký môn học',\n    navScheduleWeek: 'Thời khóa biểu tuần',\n    navCurriculum: 'Chương trình đào tạo',"
);

// 2. EN replacements
content = content.replace("majorValue: 'Information Technology',", "majorValue: 'Electronic & Telecommunications Engineering',");
content = content.replace("facultyValue: 'Faculty of Information Technology 1',", "facultyValue: 'Faculty of Telecommunications 1',");
content = content.replace(
  "navCourses: 'Courses',",
  "navCourses: 'Course Registration',\n    navScheduleWeek: 'Weekly Schedule',\n    navCurriculum: 'Curriculum',"
);

// 3. ZH replacements
content = content.replace("majorValue: '信息技术',", "majorValue: '电子通信工程',");
content = content.replace("facultyValue: '信息技术第一学院',", "facultyValue: '第一电信工程学院',");
content = content.replace(
  "navCourses: '选课系统',",
  "navCourses: '选课系统',\n    navScheduleWeek: '每周课表',\n    navCurriculum: '培养方案',"
);

// 4. KO replacements
content = content.replace("majorValue: '정보기술학과',", "majorValue: '전자통신공학과',");
content = content.replace("facultyValue: '정보기술 제1학부',", "facultyValue: '통신 제1학부',");
content = content.replace(
  "navCourses: '수강 신청',",
  "navCourses: '수강 신청',\n    navScheduleWeek: '주간 시간표',\n    navCurriculum: '교육 과정',"
);

// 5. JA replacements
content = content.replace("majorValue: '情報技術学科',", "majorValue: '電子通信工学科',");
content = content.replace("facultyValue: '情報技術第一学部',", "facultyValue: '通信第一学部',");
content = content.replace(
  "navCourses: '履修登録',",
  "navCourses: '履修登録',\n    navScheduleWeek: '週間時間割',\n    navCurriculum: 'カリキュラム',"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated src/lib/translations.ts successfully');
