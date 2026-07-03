export const timeAgo = (dateString: string): string => {
  const now = new Date().getTime();
  const then = new Date(dateString).getTime();
  const diffSeconds = Math.max(Math.floor((now - then) / 1000), 0);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
  if (diffSeconds < 2629800) return `${Math.floor(diffSeconds / 604800)}w ago`;
  if (diffSeconds < 31557600) return `${Math.floor(diffSeconds / 2629800)}mo ago`;
  return `${Math.floor(diffSeconds / 31557600)}y ago`;
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
