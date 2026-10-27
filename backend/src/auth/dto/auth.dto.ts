import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password!: string; // No validation on login - any format allowed
}

export class RegisterDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=[\]{}|;:'",.<>\/\\`~])[A-Za-z\d@$!%*?&#^()_\-+=[\]{}|;:'",.<>\/\\`~]{8,}$/,
    {
      message: 'Mật khẩu phải chứa ít nhất: 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt',
    },
  )
  password!: string;

  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  @IsOptional()
  name?: string;

  // ❌ Removed: role field - Users CANNOT self-assign ADMIN role
  // Only ADMIN users can create other users with specific roles via /api/users endpoint
}

export class RefreshTokenDto {
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'Mã xác thực không hợp lệ' })
  @IsNotEmpty({ message: 'Mã xác thực không được để trống' })
  token!: string;

  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=[\]{}|;:'",.<>\/\\`~])[A-Za-z\d@$!%*?&#^()_\-+=[\]{}|;:'",.<>\/\\`~]{8,}$/,
    {
      message: 'Mật khẩu mới phải chứa ít nhất: 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt',
    },
  )
  newPassword!: string;
}
