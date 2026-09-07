const defaultNumbers = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function readThreeDigits(threeDigits: number, showZeroHundred = false): string {
  const hundred = Math.floor(threeDigits / 100);
  const remainder = threeDigits % 100;
  const ten = Math.floor(remainder / 10);
  const unit = remainder % 10;
  let result = '';

  if (hundred > 0 || showZeroHundred) {
    result += `${defaultNumbers[hundred]} trăm `;
  }

  if (ten > 1) {
    result += `${defaultNumbers[ten]} mươi `;
    if (unit === 1) result += 'mốt ';
    else if (unit === 5) result += 'lăm ';
    else if (unit > 0) result += `${defaultNumbers[unit]} `;
  } else if (ten === 1) {
    result += 'mười ';
    if (unit === 5) result += 'lăm ';
    else if (unit > 0) result += `${defaultNumbers[unit]} `;
  } else if (unit > 0) {
    if (hundred > 0 || showZeroHundred) result += 'lẻ ';
    result += `${defaultNumbers[unit]} `;
  }

  return result.trim();
}

export function numberToVietnameseWords(num: number): string {
  if (!num || isNaN(num) || num === 0) return 'Không đồng';
  let n = Math.abs(Math.round(num));
  const groups: number[] = [];

  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  let result = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const current = groups[i];
    if (current > 0) {
      const showZero = i < groups.length - 1 && current < 100;
      const text = readThreeDigits(current, showZero);
      result += `${text} ${units[i]} `;
    }
  }

  result = result.trim() + ' đồng';
  return result.charAt(0).toUpperCase() + result.slice(1);
}
