export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';  // Handle invalid dates
  
  // Format as MM/DD/YYYY with padStart to ensure consistent leading zeros
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
};