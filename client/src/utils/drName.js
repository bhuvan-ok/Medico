export const drName = (name) => {
  if (!name) return '';
  // Match "Dr." or "Dr " or "DR." etc. — with or without space after the dot
  if (/^dr[\s.]/i.test(name.trimStart())) return name;
  return `Dr. ${name}`;
};
