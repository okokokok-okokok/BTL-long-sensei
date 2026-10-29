/**
 * Text Sanitizer Utility for PTITHAH AI
 * Loại bỏ toàn bộ ký tự đặc biệt định dạng markdown:
 * - Dấu hoa thị in đậm / in nghiêng: **từ**, *từ*, __từ__
 * - Dấu thăng tiêu đề: ###, ##, #
 * - Gạch đầu dòng dính dấu sao: * **Bước 1:** -> - Bước 1:
 * - Dấu backtick mã: `code`, ```code```
 * - Thẻ suy nghĩ của mô hình: <think>...</think>
 * - Emoji và biểu tượng trang trí không cần thiết
 * Giúp câu trả lời của Trợ lý số chuẩn xác, trong sáng, trang trọng và chuyên nghiệp.
 */

export function cleanFormattedText(text: string): string {
  if (!text) return '';

  return text
    // 0. Loại bỏ thẻ suy nghĩ (nếu có từ mô hình reasoning)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    // 1. Chuyển đổi liên kết markdown [Tiêu đề](https://...) -> Tiêu đề (https://...)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '$1 ($2)')
    // 2. Chuyển đổi danh sách đầu dòng * **Bước 1:** thành - Bước 1:
    .replace(/^[\t ]*\*\s*\*\*(.*?)\*\*/gm, '- $1')
    // 3. Chuyển đổi các dấu bullet hoa thị (*, +, •) thành gạch nối chuẩn (-)
    .replace(/^[\t ]*\*\s+/gm, '- ')
    .replace(/^[\t ]*[\+\•]\s+/gm, '- ')
    // 4. Loại bỏ ký hiệu tiêu đề markdown ### hoặc ## ở đầu dòng (### 1. -> 1.)
    .replace(/^[\t ]*#{1,6}\s+/gm, '')
    // 5. Loại bỏ ký hiệu in đậm và in nghiêng
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    // 6. Xóa triệt để các dấu sao còn sót lại
    .replace(/\*+/g, '')
    // 7. Xóa các dấu thăng đứng đơn lẻ hoặc hashtag
    .replace(/(^|\s)#{1,6}(\s|$)/gm, '$1$2')
    // 8. Xóa dấu backtick (`)
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[a-zA-Z]*\n?/g, '')
    // 9. Chuẩn hóa ký hiệu toán học nếu có
    .replace(/\$\\ge\$/g, '>=')
    .replace(/\$\\le\$/g, '<=')
    .replace(/\$([^$]+)\$/g, '$1')
    // 10. Loại bỏ emoji / biểu tượng trang trí
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    // 11. Chuẩn hóa khoảng trắng ngang liên tiếp
    .replace(/[ \t]{2,}/g, ' ')
    // 12. Chuẩn hóa dòng trống thừa (tối đa 2 dòng ngắt)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
