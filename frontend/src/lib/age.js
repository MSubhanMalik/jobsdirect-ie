export function getAdultDateMax() {
  const today = new Date();
  const adultDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );
  return adultDate.toISOString().slice(0, 10);
}

export function isAtLeast18(dateValue) {
  if (!dateValue) return false;
  const inputDate = new Date(dateValue);
  if (Number.isNaN(inputDate.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - inputDate.getFullYear();
  const monthDiff = today.getMonth() - inputDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < inputDate.getDate())
  ) {
    age -= 1;
  }

  return age >= 18;
}
