// src/services/dashboard.service.ts
import { prisma } from "../utils/db.js";

// Helper untuk menghitung persentase perubahan
const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

export const getDashboardSummary = async (userId: string, month?: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true, currency: true, dailyLimit: true },
  });

  if (!user) throw new Error("user-not-found");

  const today = new Date();
  let now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthNumber] = month.split("-").map(Number);
    if (year && monthNumber! >= 1 && monthNumber! <= 12) {
      const isCurrentMonth = year === today.getFullYear() && monthNumber! - 1 === today.getMonth();
      now = isCurrentMonth
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
        : new Date(year, monthNumber!, 0);
    }
  }
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Tanggal untuk Bulan Ini
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Tanggal untuk Bulan Lalu
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Tanggal untuk Bulan Ini
  const startOfTodayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfTodayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  // Tanggal untuk 4 Minggu Terakhir (28 Hari Terakhir)
  const startOfLast4Weeks = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  // 1. AMBIL SEMUA DATA YANG DIBUTUHKAN DARI DATABASE
  const [
    currentMonthTx,
    lastMonthTx,
    thisMonthTx,
    todayExpenses,
    last4WeeksTx
  ] = await Promise.all([
    // Transaksi bulan ini
    prisma.transaction.findMany({ where: { userId, date: { gte: startOfCurrentMonth, lt: startOfNextMonth } } }),
    // Transaksi bulan lalu
    prisma.transaction.findMany({ where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    // Transaksi bulan saat ini
    prisma.transaction.findMany({ where: { userId, date: { gte: startOfTodayMonth, lt: endOfTodayMonth } } }),
    // Pengeluaran hari ini
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: startOfToday } },
      _sum: { amount: true }
    }),
    // Transaksi 4 minggu terakhir untuk Bar Chart
    prisma.transaction.findMany({ where: { userId, date: { gte: startOfLast4Weeks } } })
  ]);

  // 2. KALKULASI OVERVIEW (Bulan Ini vs Bulan Lalu)
  let incomeThisMonth = 0, expenseThisMonth = 0;
  currentMonthTx.forEach(t => {
    if (t.type === 'INCOME') incomeThisMonth += t.amount;
    if (t.type === 'EXPENSE') expenseThisMonth += t.amount;
  });

  let incomeLastMonth = 0, expenseLastMonth = 0;
  lastMonthTx.forEach(t => {
    if (t.type === 'INCOME') incomeLastMonth += t.amount;
    if (t.type === 'EXPENSE') expenseLastMonth += t.amount;
  });

  // 2.1 Income dan expense bulan sekarang (bukan filter)
  let incomeCurrentMonth = 0, expenseCurrentMonth = 0;
  thisMonthTx.forEach(t => {
    if (t.type === 'INCOME') incomeCurrentMonth += t.amount;
    if (t.type === 'EXPENSE') expenseCurrentMonth += t.amount;
  });
  const balancePrevMonth = (user?.balance || 0) - (incomeCurrentMonth - expenseCurrentMonth);
  // const percentageChangeBalance = calculatePercentageChange(user.balance || 0, balancePrevMonth);
  // Saldo saat ini kita asumsikan dari tabel user, tapi persentase perubahannya bisa dihitung 
  // dari net income bulan ini dibandingkan dengan balance sebelum bulan ini.
  // const netSavedThisMonth = incomeThisMonth - expenseThisMonth;
  // const balanceLastMonth = (user.balance || 0) - netSavedThisMonth;
  // presentase perubahan balance bulan ini: Saldo Bulan Lalu = Saldo Saat Ini - (Total Pemasukan Bulan Ini - Total Pengeluaran Bulan Ini)

  // 3. KALKULASI SAFE TO SPEND
  let safeToSpend = null;
  if (user.dailyLimit !== null && user.dailyLimit > 0) {
    const spentToday = todayExpenses._sum.amount || 0;
    const left = user.dailyLimit - spentToday;
    const percentageUsed = Math.min((spentToday / user.dailyLimit) * 100, 100);

    safeToSpend = {
      dailyLimit: user.dailyLimit,
      spentToday: spentToday,
      left: left > 0 ? left : 0,
      percentageUsed: Number(percentageUsed.toFixed(1))
    };
  }

  // 4. KALKULASI SPENDING HOTSPOTS (Kategori Pengeluaran Bulan Ini)
  const categoryMap: Record<string, number> = {};
  currentMonthTx.filter(t => t.type === 'EXPENSE').forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const hotspotsCategories = Object.keys(categoryMap).map(category => ({
    category,
    amount: categoryMap[category],
    percentage: expenseThisMonth > 0
      ? Number((((categoryMap[category] ?? 0) / expenseThisMonth) * 100).toFixed(1))
      : 0
  })).sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

  // 5. KALKULASI INCOME VS EXPENSE (4 Minggu Terakhir)
  const weeklyData = [
    { week: "Week 1", income: 0, expense: 0 },
    { week: "Week 2", income: 0, expense: 0 },
    { week: "Week 3", income: 0, expense: 0 },
    { week: "Week 4", income: 0, expense: 0 },
  ];
  // let weeklyData: { week: string, income: number, expense: number }[] = [];

  let totalInflow4Weeks = 0;
  let totalOutflow4Weeks = 0;

  // last4WeeksTx.forEach(t => {
  currentMonthTx.forEach(t => {
    // Menentukan transaksi masuk ke minggu ke berapa (0-3)
    // const diffTime = Math.abs(now.getTime() - t.date.getTime());
    // const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // let weekIndex = 3; // Default Week 4 (Paling baru)
    // if (diffDays > 21) weekIndex = 0; // Week 1 (Paling lama)
    // else if (diffDays > 14) weekIndex = 1; // Week 2
    // else if (diffDays > 7) weekIndex = 2; // Week 3
    // weekIndex is the index of week in respective to the month
    // tentukan transaksi ini ada di minggu ke berapa dalam bulan ini
    const currentDay = t.date.getDate();
    const firstDayOfMonth = new Date(t.date.getFullYear(), t.date.getMonth(), 1);
    let dayOfWeek = firstDayOfMonth.getDay(); 
    if (dayOfWeek === 0) dayOfWeek = 7;     
    const weekIndex = Math.ceil((currentDay + dayOfWeek - 1) / 7) - 1;

    if (!weeklyData[weekIndex]) {
      weeklyData[weekIndex] = { week: `Week ${weekIndex + 1}`, income: 0, expense: 0 };
    }
    if (t.type === 'INCOME') {
      weeklyData[weekIndex]!.income += t.amount;
      totalInflow4Weeks += t.amount;
    }
    if (t.type === 'EXPENSE') {
      weeklyData[weekIndex]!.expense += t.amount;
      totalOutflow4Weeks += t.amount;
    }
    // if (weeklyData[weekIndex] !== undefined) {
    // }
  });
  // console.log(weeklyData);

  const avgInflowPerWeek = totalInflow4Weeks / 4;
  const avgOutflowPerWeek = totalOutflow4Weeks / 4;
  const netSaved4Weeks = totalInflow4Weeks - totalOutflow4Weeks;
  const savingsRate = totalInflow4Weeks > 0 ? Number(((netSaved4Weeks / totalInflow4Weeks) * 100).toFixed(1)) : 0;

  // 6. RAKIT RESPONSE SESUAI DESAIN
  return {
    overview: {
      currentBalance: {
        amount: user.balance,
        // percentageChange: calculatePercentageChange(user.balance || 0, balanceLastMonth)
        percentageChange: calculatePercentageChange(user.balance || 0, balancePrevMonth)
      },
      expensesThisMonth: {
        amount: expenseThisMonth,
        percentageChange: calculatePercentageChange(expenseThisMonth, expenseLastMonth)
      },
      incomeThisMonth: {
        amount: incomeThisMonth,
        percentageChange: calculatePercentageChange(incomeThisMonth, incomeLastMonth)
      }
    },
    safeToSpend,
    spendingHotspots: {
      totalExpenses: expenseThisMonth,
      categories: hotspotsCategories
    },
    incomeVsExpense: {
      netSaved: netSaved4Weeks,
      weeklyData,
      avgInflowPerWeek,
      avgOutflowPerWeek,
      savingsRate
    }
  };
};