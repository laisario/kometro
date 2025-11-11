export default function titleCase(s) {
  const words = s?.split('_');

  const titleCaseWords = words?.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return titleCaseWords;
}
