export const ValidationMessage = {
  EMAIL: {
    REQUIRED: 'Email không được để trống',
    INVALID: 'Email không hợp lệ',
  },

  PASSWORD: {
    REQUIRED: 'Mật khẩu không được để trống',
    MUST_BE_STRING: 'Mật khẩu phải là chuỗi ký tự',
    MIN_LENGTH: 'Mật khẩu tối thiểu phải có 3 ký tự',
  },

  ROLE: {
    REQUIRED: 'Quyền không được để trống',
    INVALID: 'Quyền phải là ADMIN hoặc USER',
  },

  STATUS: {
    REQUIRED: 'Trạng thái không được để trống',
    INVALID: 'Trạng thái phải là ACTIVE hoặc BANNED',
  },
} as const; // báo là không được phép thay đổi trong quá trình run time(có thể xóa đi)
