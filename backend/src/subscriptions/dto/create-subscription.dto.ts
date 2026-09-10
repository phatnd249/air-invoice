import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  ValidateIf,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsString({ message: 'Tên khách hàng không được để trống' })
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
  customerName!: string;

  @IsEmail({}, { message: 'Email khách hàng không đúng định dạng' })
  @IsNotEmpty({ message: 'Email khách hàng không được để trống' })
  customerEmail!: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerCompany?: string;

  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString({ message: 'Tên dịch vụ không được để trống' })
  @IsNotEmpty({ message: 'Tên dịch vụ không được để trống' })
  serviceName!: string;

  @IsNumber({}, { message: 'Giá dịch vụ phải là số' })
  @IsOptional()
  servicePrice?: number;

  @IsString()
  @IsOptional()
  cycle?: string;

  @IsString({ message: 'Ngày bắt đầu không được để trống' })
  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  startDate!: string;

  @IsString({ message: 'Ngày kết thúc không được để trống' })
  @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
  endDate!: string;

  @IsString()
  @IsIn(['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'CANCELLED'])
  @IsOptional()
  status?: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED';

  @IsString()
  @IsOptional()
  staffName?: string;

  @ValidateIf((o) => !!o.staffEmail)
  @IsEmail({}, { message: 'Email người phụ trách không đúng định dạng' })
  @IsOptional()
  staffEmail?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

