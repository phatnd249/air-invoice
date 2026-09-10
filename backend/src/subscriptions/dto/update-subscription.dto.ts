import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  ValidateIf,
} from 'class-validator';

export class UpdateSubscriptionDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @ValidateIf((o) => !!o.customerEmail)
  @IsEmail({}, { message: 'Email khách hàng không đúng định dạng' })
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerCompany?: string;

  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  serviceName?: string;

  @IsNumber({}, { message: 'Giá dịch vụ phải là số' })
  @IsOptional()
  servicePrice?: number;

  @IsString()
  @IsOptional()
  cycle?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

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
