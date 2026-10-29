async function test() {
  console.log('--- Testing /api/chat fallback cascade ---');

  const query = 'Quy chế tính điểm GPA và xếp loại học bổng PTIT như thế nào?';
  console.log('Sending query:', query);

  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        history: [],
        studentContext: {
          name: 'Vũ Hải Anh',
          studentCode: 'B23DCVT036',
          class: 'D23CQVT06-B',
          faculty: 'Khoa Viễn thông 1',
          major: 'Kỹ thuật Điện tử Viễn thông',
        },
        language: 'vi',
      }),
    });

    console.log('Response status:', res.status);
    const json = await res.json();
    console.log('Response JSON:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
