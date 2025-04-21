/**
 * PRBMath UD60x18 Constants
 * (Solidity 쪽에선 'immutable' 상수 등으로 정의)
 */
const UNIT: bigint = 1000000000000000000n; // 1e18
const LOG2_E: bigint = 1442695040888963400n; // 약 1.4426950408889634 * 1e18
const MAX_256 = (1n << 256n) - 1n;

/**
 * 에러 상황
 */
class PRBMathUD60x18_LogInputTooSmall extends Error {
  constructor(x: bigint) {
    super(`PRBMathUD60x18__LogInputTooSmall(${x.toString()})`);
  }
}
class PRBMathUD60x18_MulDivOverflow extends Error {
  constructor() {
    super("PRBMathUD60x18__MulDivOverflow");
  }
}

/**
 * @notice ln(x) in UD60x18 format, same as prb-math's `Math.ln`.
 * @dev x must be >= 1e18, i.e. real value >= 1. Otherwise throws.
 * Formula: ln(x) = log2(x) / log2(e).
 */
function ln(x: bigint): bigint {
  if (x > MAX_256) {
    throw new Error("Input too large: exceeds 256-bit range.");
  }
  if (x < UNIT) {
    // x가 1e18 미만이면(실제값 < 1) ln 정의 불가
    throw new PRBMathUD60x18_LogInputTooSmall(x);
  }
  // ln(x) = log2(x) * (1 / log2(e)) = (log2(x) * 1e18) / LOG2_E
  const log2x = log2(x);
  return mulDiv(log2x, UNIT, LOG2_E);
}

/**
 * @notice log2(x) in UD60x18 format.
 * @dev 내부적으로 128회 반복을 통해 분수 부분을 구하는 방식(128.128 고정소수 연산).
 *      prb-math 소스의 핵심 로직을 그대로 옮겼습니다.
 */
function log2(x: bigint): bigint {
  // x는 UD60x18이므로, 실제값 = x / 1e18.
  // 먼저 정수 부분: msb(x / 1e18).
  // 예) if x=8e18이면, 실제값 8, log2(8)=3 -> int part=3.
  //    bit 연산 용이하도록 x/UNIT 먼저 계산.
  if (x <= 0n) {
    // log2(0) 이하는 음의 무한대, 사실상 정의 안 됨.
    throw new Error(`log2 input must be > 0`);
  }

  // Integer part via msb of (x / UNIT).
  const xDivUnit = x / UNIT; // 버림
  const n = msb(xDivUnit); // 0 <= n <= 255 정도

  // result의 정수 부분: n * 1e18
  let result = BigInt(n) * UNIT;

  // 이제 분수 부분을 구해야 함.
  // PRBMath는 128.128-bit 정밀도로 계산:
  // y = (x << (256-128)) / 1e18 >> (255 - n)
  //   = (x << 128) / 1e18 >> (255 - n),  (왜냐하면 256-128 = 128)
  // (x << 128)는 x * 2^128
  // 시프트 -> BigInt에서 주의

  // 1) x << 128
  let y = (x << 128n);

  // 2) 나누기 1e18
  y = y / UNIT;

  // 3) 추가 시프트: >> (255 - n)
  const shift = BigInt(255 - n);
  if (shift >= 128n) {
    // 만약 n이 작아서 255-n >=128이면, 그대로 많이 쉬프트
    y = y >> (shift - 128n);
    // 그 뒤 y를 y * 2^128 중으로 활용 가능
  } else {
    // 255-n이 127 이하인 경우
    // y >> (shift) 로 그냥 끝
    y = y >> shift;
  }

  // 이제 y ~ 2^128 스케일 근방. (정확히는 128.128 고정소수)
  // 분수 부분 계산: 128회 반복
  for (let i = 0; i < 128; i++) {
    // y = y^2 >> 127
    y = (y * y) >> 127n;

    // if (y >= 2^128)
    if (y >= (1n << 128n)) {
      // y >>= 1
      y = y >> 1n;
      // result += 1 << (127 - i)
      // 이 부분도 UD60x18의 정수 증가량이므로, (127 - i)를 거듭제곱
      // 근데 여기선 고정소수점으로 보면 1<<(127-i) * 1e0?
      // prb-math는 result에 (1 << (127-i))를 그냥 더함 -> 그 결과는 2^(127-i) * (1e18단위)
      result += 1n << BigInt(127 - i);
    }
  }

  return result;
}

/**
 * @notice Return index of the most significant bit of x (0-based).
 * @dev Same logic as `msb` in prb-math. x must be > 0.
 */
function msb(x: bigint): number {
  if (x <= 0n) {
    throw new Error("msb input must be > 0");
  }
  let r = 0;
  let t = x;

  // Solidity 버전과 동일하게 8단계로 쪼개어 확인
  if (t >= (1n << 128n)) { t >>= 128n; r += 128; }
  if (t >= (1n << 64n))  { t >>= 64n;  r += 64;  }
  if (t >= (1n << 32n))  { t >>= 32n;  r += 32;  }
  if (t >= (1n << 16n))  { t >>= 16n;  r += 16;  }
  if (t >= (1n << 8n))   { t >>= 8n;   r += 8;   }
  if (t >= (1n << 4n))   { t >>= 4n;   r += 4;   }
  if (t >= (1n << 2n))   { t >>= 2n;   r += 2;   }
  if (t >= (1n << 1n))   { /* t >>= 1n; */ r += 1; }

  return r;
}

/**
 * @notice Multiplies x and y (UD60x18) and divides by denominator (UD60x18),
 *         safe for 512-bit intermediate, replicating prb-math's mulDiv.
 * @dev Throws if result would overflow 256 bits or denominator==0.
 */
function mulDiv(x: bigint, y: bigint, denominator: bigint): bigint {
  if (denominator === 0n) {
    throw new PRBMathUD60x18_MulDivOverflow();
  }
  // 512-bit multiply [prod1 prod0] = x * y
  const xy = x * y;
  // low 256 bits
  const prod0 = xy & ((1n << 256n) - 1n);
  // high 256 bits
  const prod1 = xy >> 256n;

  // Special case: if prod1==0, no overflow
  if (prod1 === 0n) {
    return prod0 / denominator;
  }

  // Ensure result < 2^256 and denominator > prod1
  if (denominator <= prod1) {
    throw new PRBMathUD60x18_MulDivOverflow();
  }

  // Remainder
  const remainder = (x * y) % denominator;

  // Subtract remainder from [prod1 prod0]
  let adjustedProd1 = prod1;
  let adjustedProd0 = prod0 - remainder;
  if (adjustedProd0 > prod0) {
    // borrow
    adjustedProd1 -= 1n;
  }

  // Factor powers of two out of denominator
  const twos = denominator & (-denominator); // largest power-of-two divisor
  let denom_ = denominator / twos;
  adjustedProd0 /= twos;

  // now combine the high bits into adjustedProd0
  // shift = twos^-1
  const shift = ((-twos) & twos) + 1n; // 2^256 / twos
  adjustedProd0 |= (adjustedProd1 * shift);

  // Invert denom_ mod 2^256 (Newton's method)
  let inverse = (3n * denom_) ^ 2n;
  for (let i = 0; i < 6; i++) {
    inverse = inverse * (2n - denom_ * inverse);
  }

  return adjustedProd0 * inverse;
}

export { ln };