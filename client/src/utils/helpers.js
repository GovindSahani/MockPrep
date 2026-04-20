// Format score out of 100
export const formatScore = (score) => {
  if (score === null || score === undefined) return 'N/A';
  return `${score}/100`;
};

// Format seconds into MM:SS string
export const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// Return a label color based on difficulty
export const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'var(--color-success, #10b981)';
    case 'medium': return 'var(--color-warning, #f59e0b)';
    case 'hard': return 'var(--color-danger, #ef4444)';
    default: return 'var(--color-text-muted, #9ca3af)';
  }
};
