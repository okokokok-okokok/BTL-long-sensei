import { Language } from './translations';
import { cleanFormattedText } from './textSanitizer';
export { cleanFormattedText };

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  chips?: string[];
  modelName?: string;
  isFallback?: boolean;
  fallbackReason?: string;
}

export interface FAQItem {
  id: string;
  keywords: string[];
  question: Record<Language, string>;
  answer: Record<Language, string>;
}

export const PTIT_FAQS: FAQItem[] = [
  {
    id: 'exam_schedule',
    keywords: ['lịch thi', 'phòng thi', 'thi học kỳ', 'thi lại', 'kỳ thi', 'exam', 'schedule', 'test', '考试', '日程', '시험', '일정'],
    question: {
      vi: 'Lịch thi và phòng thi xem ở đâu?',
      en: 'Where can I check exam schedules and rooms?',
      zh: '在哪里查看考试日程和考场？',
      ko: '시험 일정과 강의실은 어디서 확인하나요?',
      ja: '試験日程と教室はどこで確認できますか？',
    },
    answer: {
      vi: '📌 **Lịch thi Học phần Học kỳ 1 (2024 - 2025)**:\n- Lịch thi chính thức đã được công bố trên cổng **qldt.ptit.edu.vn** và mục **Thông báo** của hệ thống.\n- Địa điểm thi tập trung tại: **Giảng đường A2** và **Tòa nhà B** (Cơ sở Hà Đông - Km10 Nguyễn Trãi).\n- Sinh viên mang theo Thẻ sinh viên hoặc CCCD khi vào phòng thi.',
      en: '📌 **Semester 1 Final Exam Schedule (2024 - 2025)**:\n- Official exam schedules are posted on **qldt.ptit.edu.vn** and in the portal **Announcements** section.\n- Locations: **Lecture Hall A2** and **Building B** (Ha Dong Campus - Km10 Nguyen Trai).\n- Please bring your Student ID card or National ID into the exam room.',
      zh: '📌 **第一学期期末考试日程（2024 - 2025）**：\n- 正式考试日程已在 **qldt.ptit.edu.vn** 和系统“最新通知”栏目发布。\n- 考试地点集中在：**A2讲堂** 和 **B座大楼**（河东校区 - 阮廌路Km10）。\n- 进考场请务必携带学生证或身份证。',
      ko: '📌 **2024-2025학년도 1학기 기말고사 일정 안내**:\n- 공식 시험 일정은 **qldt.ptit.edu.vn** 및 포털 최신 공지사항에서 확인하실 수 있습니다.\n- 시험 장소: **A2 강의동** 및 **B관** (하동 캠퍼스 - 응우옌짜이 10km 지점).\n- 시험장 입실 시 학생증 또는 신분증을 반드시 지참하세요.',
      ja: '📌 **2024-2025年度 第1学期期末試験日程**:\n- 公式な試験スケジュールは **qldt.ptit.edu.vn** およびポータルの「お知らせ」に掲載されています。\n- 試験会場：**A2講義棟** および **B棟**（ハドンキャンパス）。\n- 受験時は学生証または身分証明書を必ず持参してください。',
    },
  },
  {
    id: 'gpa_calculation',
    keywords: ['tính điểm', 'gpa', 'điểm chữ', 'thang điểm 4', 'điểm tổng kết', 'grade', 'calculate', 'letter grade', 'gpa计算', '成绩', '학점', '계산', '成績計算'],
    question: {
      vi: 'Quy chế tính điểm môn học và GPA thế nào?',
      en: 'How are course grades and GPA calculated at PTIT?',
      zh: 'PTIT的课程成绩和GPA是如何计算的？',
      ko: 'PTIT 학점 및 GPA는 어떻게 계산되나요?',
      ja: 'PTITの科目成績とGPAはどのように計算されますか？',
    },
    answer: {
      vi: '📊 **Công thức tính điểm học phần PTIT**:\n- **Điểm tổng kết (hệ 10)** = `Chuyên cần (10%)` + `Giữa kỳ (30%)` + `Thi kết thúc (60%)`\n- **Quy đổi điểm chữ & hệ 4**:\n  • 9.0 - 10.0: **A+** (4.0)\n  • 8.5 - 8.9: **A** (3.7)\n  • 8.0 - 8.4: **B+** (3.5)\n  • 7.0 - 7.9: **B** (3.0)\n  • 6.5 - 6.9: **C+** (2.5)\n  • 5.5 - 6.4: **C** (2.0)\n  • 5.0 - 5.4: **D+** (1.5)\n  • 4.0 - 4.9: **D** (1.0)\n  • < 4.0: **F** (0.0 - Phải học lại)',
      en: '📊 **PTIT Course Grade Formula**:\n- **Final Score (10-point scale)** = `Attendance (10%)` + `Midterm (30%)` + `Final Exam (60%)`\n- **Grade Conversion**:\n  • 9.0 - 10.0: **A+** (4.0)\n  • 8.5 - 8.9: **A** (3.7)\n  • 8.0 - 8.4: **B+** (3.5)\n  • 7.0 - 7.9: **B** (3.0)\n  • 6.5 - 6.9: **C+** (2.5)\n  • 5.5 - 6.4: **C** (2.0)\n  • 4.0 - 4.9: **D** (1.0 - Pass)\n  • < 4.0: **F** (0.0 - Must retake)',
      zh: '📊 **PTIT课程成绩计算公式**：\n- **总评成绩（10分制）** = `平时考勤 (10%)` + `期中考 (30%)` + `期末考 (60%)`\n- **等级转换**：\n  • 9.0 - 10.0: **A+** (4.0)\n  • 8.5 - 8.9: **A** (3.7)\n  • 8.0 - 8.4: **B+** (3.5)\n  • 7.0 - 7.9: **B** (3.0)\n  • 5.5 - 6.4: **C** (2.0)\n  • 4.0 - 4.9: **D** (1.0 及格)\n  • < 4.0: **F** (0.0 不及格重修)',
      ko: '📊 **PTIT 학점 및 점수 산출 기준**:\n- **총점(10점 만점)** = `출석 (10%)` + `중간고사 (30%)` + `기말고사 (60%)`\n- **학점 변환 기준**:\n  • 9.0 - 10.0: **A+** (4.0)\n  • 8.5 - 8.9: **A** (3.7)\n  • 8.0 - 8.4: **B+** (3.5)\n  • 7.0 - 7.9: **B** (3.0)\n  • 5.5 - 6.4: **C** (2.0)\n  • 4.0 - 4.9: **D** (1.0 통과)\n  • 4.0 미만: **F** (0.0 재수강)',
      ja: '📊 **PTIT 成績計算基準**:\n- **最終成績（10点満点）** = `出席点 (10%)` + `中間試験 (30%)` + `期末試験 (60%)`\n- **評価換算**:\n  • 9.0 - 10.0: **A+** (4.0)\n  • 8.5 - 8.9: **A** (3.7)\n  • 8.0 - 8.4: **B+** (3.5)\n  • 7.0 - 7.9: **B** (3.0)\n  • 4.0 - 4.9: **D** (1.0 合格)\n  • 4.0未満: **F** (0.0 再履修)',
    },
  },
  {
    id: 'course_registration',
    keywords: ['đăng ký tín chỉ', 'đăng ký học phần', 'qldt', 'hủy môn', 'mở lớp', 'course', 'register', 'enroll', '选课', '注册课程', '수강신청', '履修登録'],
    question: {
      vi: 'Quy trình đăng ký học phần tín chỉ như thế nào?',
      en: 'How does course registration work on the PTIT portal?',
      zh: 'PTIT学分选课注册流程是怎样的？',
      ko: '수강 신청 절차는 어떻게 진행되나요?',
      ja: '履修登録の手続きはどのように行いますか？',
    },
    answer: {
      vi: '📝 **Hướng dẫn đăng ký học phần tín chỉ**:\n1. Vào mục **Khóa học** trên Portal hoặc truy cập cổng **qldt.ptit.edu.vn**.\n2. Đăng nhập bằng mã sinh viên (VD: `B21DCCN001`).\n3. Chọn học phần theo đúng khung chương trình đào tạo của Khoa.\n4. Nhấn **Đăng ký** (nếu muốn hủy, nhấn lại vào nút để hủy trước hạn quy định).\n⚠️ **Lưu ý**: Mỗi học kỳ sinh viên cần đăng ký tối thiểu **14 tín chỉ** (hoặc tối đa **25 tín chỉ**).',
      en: '📝 **Course Registration Guide**:\n1. Navigate to **Courses** on this portal or visit **qldt.ptit.edu.vn**.\n2. Log in using your Student Code (e.g. `B21DCCN001`).\n3. Select courses matching your department curriculum roadmap.\n4. Click **Register** (click again to drop before deadline).\n⚠️ **Notice**: Full-time students must register between **14 and 25 credits** per regular semester.',
      zh: '📝 **学分课程选课指南**：\n1. 访问本系统“选课系统”或直达官方 **qldt.ptit.edu.vn**。\n2. 使用学号（例如 `B21DCCN001`）登录。\n3. 根据各系教学计划选择相应学分课程。\n4. 点击“选课”进行选修（截止日前可再次点击退选）。\n⚠️ **提示**：每学期最低选修 **14学分**，最高 **25学分**。',
      ko: '📝 **수강 신청 안내**:\n1. 본 포털의 **수강신청** 메뉴 또는 **qldt.ptit.edu.vn**에 접속합니다.\n2. 학번(예: `B21DCCN001`)으로 로그인합니다.\n3. 학과별 교육과정에 맞춰 희망 교과목을 선택합니다.\n4. **수강신청** 버튼을 클릭합니다.\n⚠️ **유의사항**: 학기당 최소 **14학점**, 최대 **25학점**까지 신청 가능합니다.',
      ja: '📝 **履修登録ガイド**:\n1. ポータルの「科目登録」または **qldt.ptit.edu.vn** にアクセスします。\n2. 学籍番号（例：`B21DCCN001`）でログインします。\n3. 学科のカリキュラムに従って履修科目を選択します。\n4. **登録** ボタンを押して完了します。\n⚠️ **注意**: 1学期あたり最低 **14単位**、最大 **25単位** の履修が必要です。',
    },
  },
  {
    id: 'tuition_fee',
    keywords: ['học phí', 'nộp tiền', 'vnpay', 'ngân hàng', 'hạn nộp', 'tuition', 'fee', 'payment', '学费', '缴费', '등록금', '납부', '学費'],
    question: {
      vi: 'Làm thế nào để nộp học phí và thời hạn ra sao?',
      en: 'How to pay tuition fees and what is the deadline?',
      zh: '如何缴纳学费？截止日期是什么时候？',
      ko: '등록금 납부 방법과 마감 기한은 언제인가요?',
      ja: '学費の納入手順と納入期限について教えてください。',
    },
    answer: {
      vi: '💳 **Hướng dẫn thanh toán học phí PTIT**:\n- **Thời hạn**: Trước ngày **01/11/2024** cho Học kỳ 1.\n- **Kênh thanh toán trực tuyến**:\n  1. Cổng thanh toán **VNPay** tích hợp trên Portal sinh viên.\n  2. Chuyển khoản ngân hàng tới tài khoản Học viện (ghi rõ cú pháp: `MãSV - HọTên - NopHocPhiHK1`).\n- Sau khi thanh toán 15 phút, trạng thái công nợ sẽ được cập nhật tự động.',
      en: '💳 **PTIT Tuition Payment Instructions**:\n- **Deadline**: Before **November 1, 2024** for Fall Semester.\n- **Payment Channels**:\n  1. **VNPay Gateway** integrated on the student portal.\n  2. Bank transfer directly to PTIT Academy account (Syntax: `StudentID - FullName - TuitionFall2024`).\n- Financial status updates automatically within 15 minutes.',
      zh: '💳 **PTIT学费缴纳指引**：\n- **截止日期**：第一学期截至 **2024年11月1日**。\n- **支付渠道**：\n  1. 门户内集成的 **VNPay** 快速扫码支付。\n  2. 银行转账至学院官方银行账户（转账附言：`学号 - 姓名 - 缴纳学费`）。\n- 支付成功后约15分钟系统将自动更新缴费状态。',
      ko: '💳 **PTIT 등록금 납부 안내**:\n- **마감 기한**: 1학기 **2024년 11월 1일**까지.\n- **납부 방법**:\n  1. 포털 내 **VNPay** 온라인 결제 연동.\n  2. 학교 지정 계좌로 무통장 입금 (기재 형식: `학번 - 성명 - 1학기등록금`).\n- 납부 완료 후 15분 이내에 납부 내역이 자동 반영됩니다.',
      ja: '💳 **PTIT学費納入手続き**:\n- **納入期限**: 第1学期は **2024年11月1日** まで。\n- **納入方法**:\n  1. ポータル連携の **VNPay** オンライン決済。\n  2. 学院指定銀行口座への振込（振込名義：`学籍番号 - 氏名`）。\n- 決済完了後、約15分でシステムに反映されます。',
    },
  },
  {
    id: 'scholarship',
    keywords: ['học bổng', 'khuyến khích', 'tiêu chuẩn', 'gpa học bổng', 'scholarship', '奖学金', '장학금', '奨学金'],
    question: {
      vi: 'Tiêu chuẩn xét học bổng khuyến khích học tập PTIT?',
      en: 'What are the criteria for PTIT academic excellence scholarships?',
      zh: 'PTIT优秀学业奖学金评定标准是什么？',
      ko: 'PTIT 성적 우수 장학금 선발 기준은 무엇인가요?',
      ja: 'PTITの成績優秀奨学金の選考基準は何ですか？',
    },
    answer: {
      vi: '🏆 **Tiêu chuẩn học bổng khuyến khích PTIT**:\n- **Học bổng Xuất sắc**: GPA Học kỳ $\\ge$ **3.60** (thang 4) & Điểm rèn luyện $\\ge$ **90**.\n- **Học bổng Giỏi**: GPA Học kỳ $\\ge$ **3.20** & Điểm rèn luyện $\\ge$ **80**.\n- **Học bổng Khá**: GPA Học kỳ $\\ge$ **2.50** & Điểm rèn luyện $\\ge$ **70**.\n- **Điều kiện cần**: Đăng ký tối thiểu 15 tín chỉ trong kỳ và không có học phần nào bị điểm F.',
      en: '🏆 **PTIT Academic Scholarship Criteria**:\n- **Excellent Award**: Semester GPA $\\ge$ **3.60** & Training score $\\ge$ **90**.\n- **Good Award**: Semester GPA $\\ge$ **3.20** & Training score $\\ge$ **80**.\n- **Fair Award**: Semester GPA $\\ge$ **2.50** & Training score $\\ge$ **70**.\n- **Requirement**: Must have enrolled in at least 15 credits with zero F grades.',
      zh: '🏆 **PTIT优秀学业奖学金评定标准**：\n- **特等/优秀奖学金**：学期 GPA $\\ge$ **3.60** 且操行分 $\\ge$ **90分**。\n- **良好奖学金**：学期 GPA $\\ge$ **3.20** 且操行分 $\\ge$ **80分**。\n- **基本奖学金**：学期 GPA $\\ge$ **2.50** 且操行分 $\\ge$ **70分**。\n- **硬性条件**：当学期修读不少于15学分，且无挂科（F等）。',
      ko: '🏆 **PTIT 성적 장학금 선발 기준**:\n- **최우수 장학금**: 학기 GPA **3.60 이상** 및 품행 점수 **90점 이상**.\n- **우수 장학금**: 학기 GPA **3.20 이상** 및 품행 점수 **80점 이상**.\n- **장려 장학금**: 학기 GPA **2.50 이상** 및 품행 점수 **70점 이상**.\n- **기본 요건**: 학기당 15학점 이상 이수 및 F학점 과목 없을 것.',
      ja: '🏆 **PTIT成績優秀奨学金基準**:\n- **最優秀奨学金**: 学期GPA **3.60以上** かつ 素行評価 **90点以上**。\n- **優秀奨学金**: 学期GPA **3.20以上** かつ 素行評価 **80点以上**。\n- **奨励奨学金**: 学期GPA **2.50以上** かつ 素行評価 **70点以上**。\n- **必須要件**: 15単位以上の履修かつF評価（落第）科目なし。',
    },
  },
  {
    id: 'roles_info',
    keywords: ['tài khoản', 'vai trò', 'giảng viên', 'quản trị viên', 'admin', 'role', 'account', 'lecturer', '账户', '角色', '계정', '역할', 'アカウント', '役割'],
    question: {
      vi: 'Hệ thống có những loại tài khoản nào?',
      en: 'What account roles exist in this system?',
      zh: '系统中有哪些账户角色？',
      ko: '시스템에는 어떤 계정 역할이 있나요?',
      ja: 'システムにはどのようなアカウント権限がありますか？',
    },
    answer: {
      vi: '👥 **Hệ thống phân quyền 3 loại tài khoản**:\n1. **Tài khoản Sinh viên**: Tra cứu bảng điểm, thời khóa biểu, xem thông báo và đăng ký học phần.\n2. **Tài khoản Giảng viên**: Xem danh sách lớp phụ trách, vào điểm chuyên cần, giữa kỳ, thi kết thúc cho sinh viên.\n3. **Tài khoản Quản trị viên (Admin & Dev)**: Giám sát hoạt động hệ thống, quản lý tài khoản người dùng, cấu hình môn học và đo lường Neon DB.\n👉 Bạn có thể chuyển đổi nhanh qua lại giữa 3 vai trò tại trang **Đăng nhập**!',
      en: '👥 **3 System Account Roles**:\n1. **Student Account**: View personal dashboard, transcripts, schedule, and course registration.\n2. **Lecturer Account**: View assigned class lists, enter and update student grades directly.\n3. **Administrator Account**: System overview, manage accounts, course configurations, and Neon DB monitor.\n👉 Quick 1-click switcher available on the **Login** page!',
      zh: '👥 **系统支持3类账户权限**：\n1. **学生账户**：查询个人成绩单、课表、通知及在线选课。\n2. **讲师账户**：查看授课班级名单，在线录入及修改学生平时、期中、期末成绩。\n3. **管理员/开发账户**：全局运行监控、账户管理、课程配置及Neon DB连接指标。\n👉 可在“登录”页面一键快捷切换体验！',
      ko: '👥 **3가지 계정 권한 구분**:\n1. **학생 계정**: 성적표, 시간표, 공지사항 조회 및 수강 신청.\n2. **교수/강사 계정**: 담당 강의 수강생 명단 확인, 출석/중간/기말 성적 직접 입력.\n3. **관리자 계정**: 시스템 통계, 사용자 관리, 교과목 설정 및 Neon DB 모니터링.\n👉 **로그인** 페이지에서 1클릭으로 간편하게 전환 테스트가 가능합니다!',
      ja: '👥 **3つのアカウント権限**:\n1. **学生アカウント**: 成績表、時間割の確認、お知らせ閲覧、履修登録。\n2. **講師アカウント**: 担当講義の学生名簿閲覧、成績（出席・中間・期末）の直接入力。\n3. **管理者アカウント**: システム全体監視、ユーザー管理、科目管理、Neon DB接続確認。\n👉 **ログイン** ページからワンクリックで切り替えてお試しいただけます！',
    },
  },
  {
    id: 'contact_support',
    keywords: ['liên hệ', 'hỗ trợ', 'giáo vụ', 'địa chỉ', 'hotline', 'contact', 'support', 'help', '联系', '客服', '연락처', '문의', 'お問い合わせ'],
    question: {
      vi: 'Thông tin liên hệ Phòng Giáo vụ và Học viện PTIT?',
      en: 'Contact information for Academic Affairs & PTIT Academy?',
      zh: 'PTIT教务处及学院官方联系方式是什么？',
      ko: 'PTIT 교무처 및 학교 공식 연락처는 어떻게 되나요?',
      ja: '教務課およびPTIT学院の連絡先はどこですか？',
    },
    answer: {
      vi: '📞 **Kênh liên hệ Học viện Công nghệ Bưu chính Viễn thông (PTIT)**:\n- **Địa chỉ**: Km10, Đường Nguyễn Trãi, Q. Hà Đông, Hà Nội\n- **Phòng Giáo vụ / Đào tạo**: (024) 3352 8122 | giaovu@ptit.edu.vn\n- **Phòng Công tác sinh viên**: (024) 3351 2252 | ctsv@ptit.edu.vn\n- **Cổng thông tin đào tạo**: [qldt.ptit.edu.vn](https://qldt.ptit.edu.vn)',
      en: '📞 **PTIT Academy Contact Channels**:\n- **Address**: Km10, Nguyen Trai Street, Ha Dong District, Hanoi, Vietnam\n- **Academic Affairs Office**: (024) 3352 8122 | giaovu@ptit.edu.vn\n- **Student Affairs Office**: (024) 3351 2252 | ctsv@ptit.edu.vn\n- **Training Portal**: [qldt.ptit.edu.vn](https://qldt.ptit.edu.vn)',
      zh: '📞 **邮电通信学院（PTIT）官方联络渠道**：\n- **地址**：越南河内市河东郡阮廌路 Km10\n- **教务科/培养处**：(024) 3352 8122 | giaovu@ptit.edu.vn\n- **学生事务处**：(024) 3351 2252 | ctsv@ptit.edu.vn\n- **教务平台**：[qldt.ptit.edu.vn](https://qldt.ptit.edu.vn)',
      ko: '📞 **우전통신대학(PTIT) 주요 연락처**:\n- **주소**: 베트남 하노이 하동군 응우옌짜이로 Km10\n- **교무처**: (024) 3352 8122 | giaovu@ptit.edu.vn\n- **학생처**: (024) 3351 2252 | ctsv@ptit.edu.vn\n- **공식 학사 포털**: [qldt.ptit.edu.vn](https://qldt.ptit.edu.vn)',
      ja: '📞 **郵電通信学院（PTIT）お問い合わせ窓口**:\n- **所在地**: ベトナム・ハノイ市ハドン区グエンチャイ通り Km10\n- **教務課**: (024) 3352 8122 | giaovu@ptit.edu.vn\n- **学生課**: (024) 3351 2252 | ctsv@ptit.edu.vn\n- **教務ポータル**: [qldt.ptit.edu.vn](https://qldt.ptit.edu.vn)',
    },
  },
  {
    id: 'lecturer_grade_deadline',
    keywords: ['nhập điểm', 'nộp điểm', 'hạn nhập điểm', 'khóa sổ điểm', 'điểm quá trình', 'vào điểm', 'grade submission', 'grade entry', '录入成绩', '성적 입력'],
    question: {
      vi: 'Quy định và thời hạn nhập điểm học phần của Giảng viên?',
      en: 'What are the grade entry regulations and deadlines for Lecturers?',
      zh: '教师录入及提交课程成绩的规定和截止时间是什么？',
      ko: '교원의 학점 입력 규정 및 성적 제출 마감 기한은 언제인가요?',
      ja: '教員の成績入力規定および提出期限について教えてください。',
    },
    answer: {
      vi: '📋 **Quy định nhập điểm và nộp bảng điểm học phần (Dành cho Giảng viên)**:\n- **Điểm quá trình (Chuyên cần 10% + Giữa kỳ 30%)**: Giảng viên hoàn thành nhập trực tiếp trên cổng **qldt.ptit.edu.vn** và công bố công khai cho sinh viên trước buổi học cuối cùng ít nhất **01 tuần**.\n- **Điểm thi kết thúc học phần (60%)**: Hoàn thành chấm thi và nộp về Phòng Giáo vụ / Ban Khảo thí trong vòng **07 ngày làm việc** kể từ ngày tổ chức thi.\n- Sau khi ký duyệt bảng điểm gốc và nộp bản in có chữ ký tại Văn phòng Khoa, hệ thống sẽ tiến hành khóa sổ điểm điện tử.',
      en: '📋 **Grade Submission Guidelines for Faculty**:\n- **Continuous Assessment (Attendance 10% + Midterm 30%)**: Submit on **qldt.ptit.edu.vn** at least **1 week** prior to the final lecture.\n- **Final Exam Grades (60%)**: Complete grading and submit to Academic Affairs within **7 working days** post-exam.\n- Electronic gradebooks are finalized upon submission of signed physical rosters.',
      zh: '📋 **教师成绩录入与归档规定**：\n- **平时成绩（考勤 10% + 期中 30%）**：须在最后一节课前至少 **1周** 在 **qldt.ptit.edu.vn** 录入并向学生公布。\n- **期末考试成绩（60%）**：须在考试结束后 **7个工作日** 内完成批改并提交至教务处。\n- 经教研室签字确认纸质成绩单后，系统将正式锁定成绩库。',
      ko: '📋 **교원 성적 입력 및 제출 규정**:\n- **과정 평가 성적 (출석 10% + 중간 30%)**: 종강 최소 **1주일 전**까지 **qldt.ptit.edu.vn**에 입력 및 학생 공지.\n- **기말고사 성적 (60%)**: 시험일로부터 **근무일 기준 7일 이내**에 채점 완료 및 교무처 제출.\n- 서명된 최종 성적표 원본 제출 후 전산 시스템이 마감됩니다.',
      ja: '📋 **教員向け成績入力・提出規定**:\n- **平常点（出席 10% + 中間 30%）**: 最終授業の少なくとも **1週間前** までに **qldt.ptit.edu.vn** に入力・公開。\n- **期末試験成績（60%）**: 試験終了後 **7営業日以内** に採点を完了し教務課へ提出。\n- 署名済み成績原本の提出をもってシステム上の成績が確定・ロックされます。',
    },
  },
  {
    id: 'lecturer_proctoring',
    keywords: ['coi thi', 'giám thị', 'quy chế thi', 'xử lý vi phạm', 'biên bản', 'phòng thi', 'proctor', 'invigilation', '监考', '시험 감독'],
    question: {
      vi: 'Quy định coi thi và xử lý vi phạm quy chế thi đối với Cán bộ coi thi?',
      en: 'Exam proctoring guidelines and handling of irregularities for Invigilators?',
      zh: '监考教师监考守则及考场违规行为处理流程？',
      ko: '시험 감독관 규정 및 부정행위 발생 시 처리 절차는 어떻게 되나요?',
      ja: '試験監督規定および不正行為発生時の対応手順について教えてください。',
    },
    answer: {
      vi: '⚖️ **Quy định coi thi và lập biên bản vi phạm (Giảng viên / Cán bộ coi thi)**:\n- **Thời gian có mặt**: Cán bộ coi thi có mặt tại Phòng Hội đồng thi trước giờ phát đề **30 phút** để nhận đề thi niêm phong, danh sách thí sinh và thẻ bàn.\n- **Kiểm tra phòng thi**: Đối chiếu Thẻ sinh viên/CCCD, yêu cầu sinh viên tắt nguồn điện thoại và để toàn bộ tư trang ngoài hành lang phòng thi.\n- **Xử lý vi phạm**: Khi phát hiện hành vi gian lận (sử dụng tài liệu, thiết bị thu phát), lập ngay **Biên bản vi phạm quy chế thi**, tịch thu tang vật (nếu có), yêu cầu sinh viên ký nhận và chuyển giao Hội đồng thi để xử lý theo khung kỷ luật.',
      en: '⚖️ **Exam Invigilation & Infraction Protocols**:\n- **Arrival**: Present at the Exam Council Room **30 minutes** prior to exam start.\n- **Verification**: Check Student ID/National ID; ensure all mobile phones are powered off and placed outside.\n- **Infractions**: In case of cheating, immediately draw up an official Violation Report, secure evidence, and notify the Chief Invigilator.',
      zh: '⚖️ **监考及违纪处理规范**：\n- **到达时间**：监考教师须提前 **30分钟** 到达考务办公室领取密封试卷及考生花名册。\n- **考场核验**：严格核对学生证/身份证，督促考生关机并将电子设备集中存放。\n- **违规处理**：发现作弊行为立即中止并当场填写《考场违规处理记录单》，收存证据并上报考务委员会处理。',
      ko: '⚖️ **시험 감독 및 부정행위 처리 지침**:\n- **출근 시간**: 시험 시작 **30분 전**까지 고사 본부에 입실하여 문제지 및 명부 수령.\n- **본인 확인**: 학생증/신분증 대조 및 모든 전자기기 전원 종료 후 지정 장소 보관 확인.\n- **부정행위 조치**: 적발 시 즉시 부정행위 확인서를 작성하고 물증을 확보하여 시험본부에 보고.',
      ja: '⚖️ **試験監督および不正行為対応規定**:\n- **集合時間**: 試験開始 **30分前** までに試験本部へ集合し、封印問題用紙を受領。\n- **本人確認**: 学生証・身分証の照合、携帯電話等の電源オフと所定場所への保管を徹底。\n- **不正行為対応**: 発見次第、速やかに「不正行為報告書」を作成し証拠を確保の上、試験委員会へ報告。',
    },
  },
  {
    id: 'lecturer_grade_amendment',
    keywords: ['sửa điểm', 'điều chỉnh điểm', 'sai sót điểm', 'đính chính điểm', 'edit grade', 'amend grade', '修改成绩', '성적 정정'],
    question: {
      vi: 'Quy trình xin điều chỉnh điểm học phần sau khi đã khóa sổ điểm?',
      en: 'What is the procedure for grade correction after gradebook closure?',
      zh: '成绩封库后申请更正或修改成绩的流程是怎样的？',
      ko: '성적 마감 후 오류 정정 및 수정 신청 절차는 어떻게 되나요?',
      ja: '成績確定・ロック後の修正申請手順について教えてください。',
    },
    answer: {
      vi: '📝 **Quy trình xin điều chỉnh điểm học phần đã khóa sổ**:\n1. Giảng viên phụ trách lập **Đơn đề nghị điều chỉnh điểm** (nêu rõ lý do sai sót kỹ thuật hoặc cộng nhầm điểm).\n2. Đính kèm bài thi gốc, phiếu chấm đối sánh có chữ ký của cả 2 giảng viên chấm thi.\n3. Trình Trưởng Bộ môn chuyên môn và Lãnh đạo Khoa Viễn thông 1 ký duyệt.\n4. Nộp hồ sơ về Phòng Đào tạo / Ban Khảo thí để Hội đồng mở cổng cập nhật lại điểm số chính thức trên hệ thống.',
      en: '📝 **Post-Closure Grade Correction Procedure**:\n1. Instructor submits official Grade Amendment Form stating specific technical/scoring reasons.\n2. Attach original exam paper and scoring sheet signed by both graders.\n3. Obtain approvals from Head of Department and Dean of Telecommunications Faculty.\n4. Submit dossier to Academic Affairs / Examination Board for official system adjustment.',
      zh: '📝 **成绩归档后更正审批流程**：\n1. 授课教师填写《成绩更正申请表》，说明核算或登分差错原因。\n2. 附上原始试卷及两位阅卷教师签字的双评记录单。\n3. 经教研室主任及电信一系系领导审核签字。\n4. 提交教务处审核后由系统管理员在规定期限内重新开放录入权限。',
      ko: '📝 **성적 마감 후 정정 절차**:\n1. 담당 교수가 오류 사유를 명시한 **성적 정정 신청서** 작성.\n2. 채점자 2인의 서명이 포함된 원본 답안지 및 채점표 첨부.\n3. 학과장 및 통신1학부 학부장 결재.\n4. 교무처 제출 후 정정 승인 및 전산 반영.',
      ja: '📝 **成績確定後の訂正申請手順**:\n1. 担当教員が具体的な訂正理由を明記した「成績訂正申請書」を作成。\n2. 採点者2名の署名入り答案原本および採点照合表を添付。\n3. 専門学科長および通信第1学部長の承認印を受領。\n4. 教務課へ提出後、システム上で正式な修正・再確定を実施。',
    },
  },
];

// Smart response generator for any query
export function getChatbotResponse(query: string, lang: Language): string {
  const clean = query.toLowerCase().trim();

  // Match against keywords
  let bestMatch: FAQItem | null = null;
  let maxScore = 0;

  for (const faq of PTIT_FAQS) {
    let score = 0;
    for (const kw of faq.keywords) {
      if (clean.includes(kw.toLowerCase())) {
        score += kw.length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMatch = faq;
    }
  }

  if (bestMatch && maxScore > 0) {
    const rawAnswer = bestMatch.answer[lang] || bestMatch.answer.vi;
    return cleanFormattedText(rawAnswer);
  }

  // Generic fallback if not recognized
  const fallbacks: Record<Language, string> = {
    vi: 'Tôi là PTITHAH AI - Trợ lý số Học viện Công nghệ Bưu chính Viễn thông. Tôi đã ghi nhận câu hỏi của bạn. Để được giải đáp chính xác nhất, bạn có thể chọn các chủ đề gợi ý nhanh phía dưới hoặc hỏi về Lịch thi & phòng thi, Cách tính điểm GPA/CPA, Đăng ký tín chỉ, Quy chế đào tạo, hoặc Liên hệ Phòng Giáo vụ nhé!',
    en: 'I am PTITHAH AI - Official Digital Assistant of PTIT Academy. To assist you best, please select one of the suggestion chips below or ask about Exam schedules & rooms, GPA calculation, Course registration, Academic regulations, or Academic Affairs Office!',
    zh: '我是 PTITHAH AI - 邮电通信学院官方智能学业助教。我已记录您的问题。为了获得最准确的解答，您可以点击下方的快捷标签，或咨询有关 考试日程与考场、GPA成绩计算、选课注册、教学规章 或 教务处联系方式！',
    ko: '저는 PTITHAH AI - 우전통신대학(PTIT) 공식 학사 인공지능 도우미입니다. 가장 정확한 안내를 위해 아래 추천 질문을 선택하시거나 시험 일정 및 고사장, GPA 학점 계산, 수강 신청, 학사 규정, 교무처 연락처에 대해 질문해 주세요!',
    ja: '私は PTITHAH AI - 郵電通信学院（PTIT）公式デジタルアシスタントです。より的確にご案内するため、下の候補をタップするか、試験日程・教室、GPA計算、履修登録、学則規定、教務課窓口 についてお尋ねください。',
  };

  const rawFallback = fallbacks[lang] || fallbacks.vi;
  return cleanFormattedText(rawFallback);
}
