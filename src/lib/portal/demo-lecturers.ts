export type DemoLecturer = {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  lecturerCode: string;
  department: string;
  faculty: string;
};

// Nine additional lecturer accounts bring the three active faculties to five
// lecturers each. Every lecturer can be assigned several course subjects.
export const demoAdditionalLecturers: DemoLecturer[] = [
  { id: 'usr-gv-nguyenhaidang', username: 'gv.nguyenhaidang', password: 'ptit@123', name: 'ThS. Nguyễn Hải Đăng', email: 'nguyenhaidang.gv@ptit.edu.vn', lecturerCode: 'GV2012', department: 'Khoa Viễn thông 1', faculty: 'Khoa Viễn thông 1' },
  { id: 'usr-gv-tranngocbich', username: 'gv.tranngocbich', password: 'ptit@123', name: 'TS. Trần Ngọc Bích', email: 'tranngocbich.gv@ptit.edu.vn', lecturerCode: 'GV2013', department: 'Khoa Viễn thông 1', faculty: 'Khoa Viễn thông 1' },
  { id: 'usr-gv-nguyenthuylinh', username: 'gv.nguyenthuy.linh', password: 'ptit@123', name: 'TS. Nguyễn Thùy Linh', email: 'nguyenthuy.linh.gv@ptit.edu.vn', lecturerCode: 'GV2014', department: 'Khoa Công nghệ thông tin 1', faculty: 'Khoa Công nghệ thông tin 1' },
  { id: 'usr-gv-phamducthanh', username: 'gv.phamducthanh', password: 'ptit@123', name: 'ThS. Phạm Đức Thành', email: 'phamducthanh.gv@ptit.edu.vn', lecturerCode: 'GV2015', department: 'Khoa Công nghệ thông tin 1', faculty: 'Khoa Công nghệ thông tin 1' },
  { id: 'usr-gv-hoangminhanh', username: 'gv.hoangminhanh', password: 'ptit@123', name: 'TS. Hoàng Minh Anh', email: 'hoangminhanh.gv@ptit.edu.vn', lecturerCode: 'GV2016', department: 'Khoa Công nghệ thông tin 1', faculty: 'Khoa Công nghệ thông tin 1' },
  { id: 'usr-gv-dominhkhang', username: 'gv.dominhkhang', password: 'ptit@123', name: 'TS. Đỗ Minh Khang', email: 'dominhkhang.gv@ptit.edu.vn', lecturerCode: 'GV2017', department: 'Khoa An toàn thông tin', faculty: 'Khoa An toàn thông tin' },
  { id: 'usr-gv-lethanhtruc', username: 'gv.lethanhtruc', password: 'ptit@123', name: 'ThS. Lê Thanh Trúc', email: 'lethanhtruc.gv@ptit.edu.vn', lecturerCode: 'GV2018', department: 'Khoa An toàn thông tin', faculty: 'Khoa An toàn thông tin' },
  { id: 'usr-gv-nguyenbaolong', username: 'gv.nguyenbaolong', password: 'ptit@123', name: 'TS. Nguyễn Bảo Long', email: 'nguyenbaolong.gv@ptit.edu.vn', lecturerCode: 'GV2019', department: 'Khoa An toàn thông tin', faculty: 'Khoa An toàn thông tin' },
  { id: 'usr-gv-trankhanhvy', username: 'gv.trankhanhvy', password: 'ptit@123', name: 'ThS. Trần Khánh Vy', email: 'trankhanhvy.gv@ptit.edu.vn', lecturerCode: 'GV2020', department: 'Khoa An toàn thông tin', faculty: 'Khoa An toàn thông tin' },
];
