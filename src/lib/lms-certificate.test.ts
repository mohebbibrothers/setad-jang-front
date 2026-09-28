import { describe, expect, it } from 'vitest';
import {
  formatCertificateDate,
  mapCertificateVerify,
  sanitizeCertificateCode,
} from './lms-certificate';

describe('sanitizeCertificateCode', () => {
  it('کدِ واقعیِ backend (۲۴ هگز lowercase) را می‌پذیرد', () => {
    const code = 'a1b2c3d4e5f60718293a4b5c';
    expect(sanitizeCertificateCode(code)).toBe(code);
  });

  it('حروف بزرگ، # و فضای اطراف را نرمال می‌کند', () => {
    expect(sanitizeCertificateCode('  #AB12-CD34 ')).toBe('ab12-cd34');
    expect(sanitizeCertificateCode('##XYZW-9876')).toBe('xyzw-9876');
  });

  it('underline را هم می‌پذیرد (الفبای SlugField)', () => {
    expect(sanitizeCertificateCode('cert_demo_1405')).toBe('cert_demo_1405');
  });

  it('ورودی‌های خطرناک/نامعتبر را دور می‌ریزد', () => {
    expect(sanitizeCertificateCode('')).toBeNull();
    expect(sanitizeCertificateCode('   ')).toBeNull();
    expect(sanitizeCertificateCode('ab')).toBeNull(); // کوتاه‌تر از کفِ ۴
    expect(sanitizeCertificateCode('abc!def')).toBeNull();
    expect(sanitizeCertificateCode('../../etc/passwd')).toBeNull();
    expect(sanitizeCertificateCode("x' OR 1=1--")).toBeNull();
    expect(sanitizeCertificateCode('a'.repeat(100))).toBeNull(); // بلندتر از سقف
    expect(sanitizeCertificateCode('کد فارسی')).toBeNull(); // اسلاگ اسکی است
    expect(sanitizeCertificateCode('-startwithdash')).toBeNull();
    expect(sanitizeCertificateCode('endswithdash-')).toBeNull();
  });
});

describe('mapCertificateVerify', () => {
  it('فیلدهای اسنیک‌کیس را به مدلِ نمایشی می‌نشاند', () => {
    expect(
      mapCertificateVerify({
        certificate_code: 'AB12CD',
        full_name_snapshot: '  علی رضایی ',
        course_title_snapshot: 'کلاس پهپاد',
        instructor_name_snapshot: 'یوسفی',
        score_out_of_20: 18.5,
        issued_at: '2026-09-01T10:00:00Z',
      }),
    ).toEqual({
      certificateCode: 'AB12CD',
      fullName: 'علی رضایی',
      courseTitle: 'کلاس پهپاد',
      instructorName: 'یوسفی',
      scoreOutOf20: 18.5,
      issuedAt: '2026-09-01T10:00:00Z',
    });
  });

  it('فیلدهای غایب/خراب شکننده نیستند', () => {
    expect(mapCertificateVerify({})).toEqual({
      certificateCode: '',
      fullName: '',
      courseTitle: '',
      instructorName: '',
      scoreOutOf20: null,
      issuedAt: null,
    });
    expect(mapCertificateVerify({ score_out_of_20: 'هجده' }).scoreOutOf20).toBeNull();
    expect(mapCertificateVerify({ score_out_of_20: null }).scoreOutOf20).toBeNull();
    expect(mapCertificateVerify({ score_out_of_20: '19' }).scoreOutOf20).toBe(19);
  });
});

describe('formatCertificateDate', () => {
  it('ISO معتبر را فارسی می‌کند و خراب را پنهان', () => {
    expect(formatCertificateDate('2026-09-01T10:00:00Z')).toMatch(/۱۴۰۵/);
    expect(formatCertificateDate(null)).toBe('');
    expect(formatCertificateDate('not-a-date')).toBe('');
  });
});
