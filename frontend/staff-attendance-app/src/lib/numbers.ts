// true for "12", "-1.5", "0.25"; false for "", "abc"
export function isNumber(value: string): boolean {
  return value.trim() !== "" && !Number.isNaN(Number(value));
}