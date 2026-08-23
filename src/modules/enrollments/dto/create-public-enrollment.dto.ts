import {
  IsEmail,
  IsInt,
  IsPositive,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreatePublicEnrollmentDto {
  @IsString()
  @MinLength(2)
  contactName: string;

  // Not strictly limited to @gmail.com addresses: the spec calls it "the Gmail
  // address they'll use to study" because Google Sign-In is the login method,
  // but rejecting non-Gmail addresses would be an arbitrary UX trap (typos,
  // Google Workspace accounts on a custom domain still work with Google login).
  // We validate it's a well-formed email and match it verbatim against the
  // Google-verified email on login.
  @IsEmail()
  contactEmail: string;

  @IsString()
  @Matches(/^[0-9+()\-\s]{8,20}$/, {
    message: 'contactPhone phải là số điện thoại hợp lệ',
  })
  contactPhone: string;

  @IsInt()
  @IsPositive()
  courseId: number;
}
