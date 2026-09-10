import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password?: string;

  @IsString({ message: 'Họ và tên phải là chuỗi ký tự' })
  @IsOptional()
  name?: string;

  @IsString()
  @IsIn(['ADMIN', 'USER'], { message: 'Vai trò phải là ADMIN hoặc USER' })
  @IsOptional()
  role?: 'ADMIN' | 'USER';
}
