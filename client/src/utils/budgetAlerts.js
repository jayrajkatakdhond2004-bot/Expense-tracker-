import toast from 'react-hot-toast';
import { budgetApi } from '../api';

/** After an expense is saved, warn if it pushed a budget past 80% or 100%. */
export async function notifyBudgetAlerts(dateISO) {
  try {
    const budgets = await budgetApi.list(dateISO.slice(0, 7));
    for (const b of budgets) {
      const name = b.category?.name ?? 'Overall';
      if (b.status === 'exceeded') {
        toast.error(`${name} budget exceeded (${b.percent}% used)`, { id: `budget-${b._id}` });
      } else if (b.status === 'warning') {
        toast(`${name} budget is at ${b.percent}%`, { icon: '⚠️', id: `budget-${b._id}` });
      }
    }
  } catch {
    /* alerts are best-effort */
  }
}
