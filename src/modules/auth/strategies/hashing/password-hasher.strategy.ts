// luật
export abstract class PasswordHasherStrategy {
  abstract hash(password: string): Promise<string>; // mã hóa [do là bất đồng bộ nên phải trả về Promise]
  abstract compare(password, passwordHash): Promise<boolean>; // dịch ngược mã hóa - chỉ cho bt T/F
}
