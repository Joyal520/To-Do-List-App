export function formatDueDate(dateString?: string): {
  text: string;
  isOverdue: boolean;
  isToday: boolean;
  isSoon: boolean;
} {
  if (!dateString) {
    return { text: '', isOverdue: false, isToday: false, isSoon: false };
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = dateString.split('-');
    if (parts.length !== 3) {
      return { text: dateString, isOverdue: false, isToday: false, isSoon: false };
    }

    const due = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return {
        text: absDays === 1 ? 'Overdue by 1d' : `Overdue (${absDays}d)`,
        isOverdue: true,
        isToday: false,
        isSoon: false,
      };
    }

    if (diffDays === 0) {
      return { text: 'Due today', isOverdue: false, isToday: true, isSoon: true };
    }

    if (diffDays === 1) {
      return { text: 'Due tomorrow', isOverdue: false, isToday: false, isSoon: true };
    }

    if (diffDays <= 3) {
      return { text: `In ${diffDays} days`, isOverdue: false, isToday: false, isSoon: true };
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      text: `${monthNames[due.getMonth()]} ${due.getDate()}`,
      isOverdue: false,
      isToday: false,
      isSoon: false,
    };
  } catch {
    return { text: dateString, isOverdue: false, isToday: false, isSoon: false };
  }
}

export function formatCreatedDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
