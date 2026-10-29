import { getAiResponseWithFallback } from '../src/lib/aiService.js';

// Test runner directly importing getAiResponseWithFallback
async function runSimulation() {
  console.log('Testing cascade fallback directly...');
  const res = await getAiResponseWithFallback(
    'Học phí VNPay nộp thế nào?',
    [],
    { name: 'Vũ Hải Anh', faculty: 'Khoa Viễn thông 1', major: 'Kỹ thuật Điện tử Viễn thông' },
    'vi'
  );
  console.log('Cascade result:', res);
}

runSimulation();
