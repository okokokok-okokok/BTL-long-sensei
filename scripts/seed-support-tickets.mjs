import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
const dbUrl = match ? match[1] : null;

if (!dbUrl) {
  console.error('DATABASE_URL not found!');
  process.exit(1);
}

const sql = neon(dbUrl);

export const initialSupportTickets = [
  {
    ticketCode: 'TK-2026-081',
    userName: 'Nguyễn Đức Anh',
    userRole: 'student',
    userCode: 'B23DCVT022',
    email: 'b23dcvt022@stu.ptit.edu.vn',
    classNameOrDept: 'D23CQVT04-B',
    category: 'grade_appeal',
    subject: 'Đề nghị phúc khảo bài thi kết thúc học phần môn Lập trình C++ (INT1402)',
    content: 'Em chào Phòng Giáo vụ, em xin phép đề nghị phúc khảo lại điểm thi cuối kỳ môn Lập trình C++ lớp D23CQVT04-B. Điểm thi công bố là 8.5 nhưng em tự chấm theo đáp án chính thức đạt khoảng 9.5 điểm. Kính mong thầy/cô rút túi bài thi kiểm tra lại giúp em. Em xin trân trọng cảm ơn!',
    priority: 'urgent',
    status: 'processing',
    currentStepIndex: 3,
    steps: [
      {
        step: 1,
        title: 'Gửi yêu cầu thành công',
        description: 'Sinh viên đã gửi đơn phúc khảo trực tuyến qua Cổng thông tin đào tạo',
        timestamp: '08:30 ngày 11/09/2026',
        completed: true,
        current: false,
      },
      {
        step: 2,
        title: 'QTV & Phòng Giáo vụ tiếp nhận',
        description: 'Cán bộ giáo vụ đã tiếp nhận đơn hợp lệ và phân công chuyên viên thẩm định',
        timestamp: '09:45 ngày 11/09/2026',
        completed: true,
        current: false,
      },
      {
        step: 3,
        title: 'Đang thẩm tra & xử lý bài thi',
        description: 'Đang rút bài thi gốc từ kho lưu trữ đề thi và đối chiếu ba bên cùng giảng viên bộ môn',
        timestamp: '11:15 ngày 11/09/2026',
        completed: false,
        current: true,
      },
      {
        step: 4,
        title: 'Hoàn tất & thông báo kết quả',
        description: 'Cập nhật điểm thi chính thức vào sổ điểm điện tử và gửi thông báo kết quả cho sinh viên',
        timestamp: undefined,
        completed: false,
        current: false,
      },
    ],
    estimatedCompletion: '16:30 ngày 12/09/2026',
    adminResponse: 'Phòng Giáo vụ đã tiếp nhận đơn phúc khảo của sinh viên. Hiện tại cán bộ khảo thí đang rút bài thi gốc để đối chiếu cùng giảng viên chấm thi.',
    adminHandlerName: 'Quản trị viên PTIT - Phòng Giáo vụ',
    createdAt: new Date('2026-09-11T08:30:00+07:00').toISOString(),
    updatedAt: new Date('2026-09-11T11:15:00+07:00').toISOString(),
  },
  {
    ticketCode: 'TK-2026-079',
    userName: 'TS. Nguyễn Thị Thu Hiền',
    userRole: 'lecturer',
    userCode: 'GV2001',
    email: 'Hienntt@ptit.edu.vn',
    classNameOrDept: 'Khoa Viễn thông 1',
    category: 'course_reg',
    subject: 'Đề nghị nâng chỉ tiêu lớp học phần Cấu trúc dữ liệu và giải thuật (INT1306)',
    content: 'Kính gửi Ban Quản lý Đào tạo, hiện tại lớp học phần INT1306 do tôi phụ trách đã đạt chỉ tiêu tối đa 50/50 sinh viên. Nhiều sinh viên ngành Viễn thông cần đăng ký trả nợ môn này để kịp tiến độ tốt nghiệp. Đề nghị nâng chỉ tiêu lên 60 sinh viên.',
    priority: 'normal',
    status: 'resolved',
    currentStepIndex: 4,
    steps: [
      {
        step: 1,
        title: 'Gửi yêu cầu thành công',
        description: 'Giảng viên gửi yêu cầu nâng chỉ tiêu lớp tín chỉ',
        timestamp: '14:00 ngày 10/09/2026',
        completed: true,
        current: false,
      },
      {
        step: 2,
        title: 'QTV & Phòng Giáo vụ tiếp nhận',
        description: 'Hệ thống ghi nhận và kiểm tra sức chứa giảng đường A2-201',
        timestamp: '14:30 ngày 10/09/2026',
        completed: true,
        current: false,
      },
      {
        step: 3,
        title: 'Đang thẩm tra & xử lý',
        description: 'Phòng Quản trị thiết bị xác nhận giảng đường A2-201 đủ 65 chỗ ngồi',
        timestamp: '15:20 ngày 10/09/2026',
        completed: true,
        current: false,
      },
      {
        step: 4,
        title: 'Hoàn tất & thông báo kết quả',
        description: 'Đã nâng chỉ tiêu lớp INT1306 lên 60 sinh viên trên hệ thống portal',
        timestamp: '16:45 ngày 10/09/2026',
        completed: true,
        current: true,
      },
    ],
    estimatedCompletion: 'Đã hoàn thành lúc 16:45 ngày 10/09/2026',
    adminResponse: 'Đã hoàn tất điều chỉnh sức chứa lớp học phần INT1306 lên 60 sinh viên trên hệ thống đăng ký tín chỉ.',
    adminHandlerName: 'Quản trị viên PTIT - Trung tâm Quản trị Mạng',
    createdAt: new Date('2026-09-10T14:00:00+07:00').toISOString(),
    updatedAt: new Date('2026-09-10T16:45:00+07:00').toISOString(),
  },
  {
    ticketCode: 'TK-2026-085',
    userName: 'Vũ Hải Anh',
    userRole: 'student',
    userCode: 'B23DCVT036',
    email: 'b23dcvt036@stu.ptit.edu.vn',
    classNameOrDept: 'D23CQVT06-B',
    category: 'account_security',
    subject: 'Hỗ trợ đồng bộ tài khoản truy cập Thư viện số và CSDL Khoa học PTIT',
    content: 'Em chào thầy cô quản trị viên, em sử dụng email sinh viên để đăng nhập vào trang Thư viện số PTIT thì nhận được thông báo "Tài khoản chưa được kích hoạt quyền tra cứu tài liệu số". Em xin nhờ thầy cô hỗ trợ đồng bộ dữ liệu tài khoản giúp em ạ.',
    priority: 'normal',
    status: 'submitted',
    currentStepIndex: 1,
    steps: [
      {
        step: 1,
        title: 'Gửi yêu cầu thành công',
        description: 'Sinh viên đã gửi yêu cầu đồng bộ tài khoản thư viện số',
        timestamp: '09:00 ngày 11/09/2026',
        completed: true,
        current: true,
      },
      {
        step: 2,
        title: 'QTV & Phòng Giáo vụ tiếp nhận',
        description: 'Chờ cán bộ kỹ thuật tiếp nhận kiểm tra trên Active Directory',
        timestamp: undefined,
        completed: false,
        current: false,
      },
      {
        step: 3,
        title: 'Đang thẩm tra & xử lý',
        description: 'Đồng bộ lại tài khoản thư viện và phân quyền nhóm sinh viên D23',
        timestamp: undefined,
        completed: false,
        current: false,
      },
      {
        step: 4,
        title: 'Hoàn tất & thông báo kết quả',
        description: 'Gửi email xác nhận kích hoạt thành công đến sinh viên',
        timestamp: undefined,
        completed: false,
        current: false,
      },
    ],
    estimatedCompletion: '17:00 ngày 11/09/2026 (Dự kiến trong ngày)',
    adminResponse: 'Yêu cầu đang chờ cán bộ kỹ thuật mạng xử lý trong ca trực sáng nay.',
    adminHandlerName: 'Quản trị viên PTIT',
    createdAt: new Date('2026-09-11T09:00:00+07:00').toISOString(),
    updatedAt: new Date('2026-09-11T09:00:00+07:00').toISOString(),
  }
];

async function run() {
  console.log('🚀 Setting up support_tickets table in Neon PostgreSQL...');

  // 1. Create table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_code VARCHAR(50) UNIQUE NOT NULL,
      user_id VARCHAR(100),
      user_name VARCHAR(100) NOT NULL,
      user_role VARCHAR(20) NOT NULL,
      user_code VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL,
      class_name_or_dept VARCHAR(100),
      category VARCHAR(50) NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      priority VARCHAR(20) DEFAULT 'normal',
      status VARCHAR(20) DEFAULT 'submitted',
      current_step_index INT DEFAULT 1,
      steps JSONB NOT NULL,
      estimated_completion VARCHAR(100),
      admin_response TEXT,
      admin_handler_name VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_support_tickets_code ON support_tickets(user_code);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);`;

  // 2. Insert initial tickets
  for (const t of initialSupportTickets) {
    await sql`
      INSERT INTO support_tickets (
        ticket_code, user_name, user_role, user_code, email, class_name_or_dept,
        category, subject, content, priority, status, current_step_index,
        steps, estimated_completion, admin_response, admin_handler_name,
        created_at, updated_at
      ) VALUES (
        ${t.ticketCode}, ${t.userName}, ${t.userRole}, ${t.userCode}, ${t.email}, ${t.classNameOrDept},
        ${t.category}, ${t.subject}, ${t.content}, ${t.priority}, ${t.status}, ${t.currentStepIndex},
        ${JSON.stringify(t.steps)}, ${t.estimatedCompletion}, ${t.adminResponse}, ${t.adminHandlerName},
        ${t.createdAt}, ${t.updatedAt}
      )
      ON CONFLICT (ticket_code) DO UPDATE SET
        subject = EXCLUDED.subject,
        content = EXCLUDED.content,
        status = EXCLUDED.status,
        current_step_index = EXCLUDED.current_step_index,
        steps = EXCLUDED.steps,
        estimated_completion = EXCLUDED.estimated_completion,
        admin_response = EXCLUDED.admin_response,
        admin_handler_name = EXCLUDED.admin_handler_name,
        updated_at = EXCLUDED.updated_at
    `;
  }

  const [count] = await sql`SELECT COUNT(*)::int AS count FROM support_tickets`;
  console.log(`✅ Completed! Total support tickets in Neon DB: ${count.count}`);
}

run().catch(err => {
  console.error('Error seeding support tickets:', err);
  process.exit(1);
});
