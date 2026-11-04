import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'فرمت شماره موبایل نامعتبر است' })
  phone!: string;
}

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'فرمت شماره موبایل نامعتبر است' })
  phone!: string;

  @IsNotEmpty({ message: 'کد تأیید الزامی است' })
  @IsString()
  @Length(6, 6, { message: 'کد تأیید باید ۶ رقم باشد' })
  code!: string;
}
