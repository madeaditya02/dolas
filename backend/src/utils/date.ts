// src/utils/date.ts
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// Registrasi plugin
dayjs.extend(utc);
dayjs.extend(timezone);

export const dateHelper = {
  /**
   * Mendapatkan awal hari dalam bentuk UTC berdasarkan zona waktu pengguna.
   * Contoh: 30 Sept 2026 00:00 WITA -> 29 Sept 2026 16:00 UTC
   */
  getStartOfDay: (tz: string, date: Date | string = new Date()) => {
    return dayjs(date).tz(tz).startOf("day").toDate();
  },

  /**
   * Mendapatkan akhir hari dalam bentuk UTC berdasarkan zona waktu pengguna.
   */
  getEndOfDay: (tz: string, date: Date | string = new Date()) => {
    return dayjs(date).tz(tz).endOf("day").toDate();
  },

  getStartOfMonth: (tz: string, date: Date | string = new Date()) => {
    return dayjs(date).tz(tz).startOf("month").toDate();
  },

  getEndOfMonth: (tz: string, date: Date | string = new Date()) => {
    return dayjs(date).tz(tz).endOf("month").toDate();
  },

  getStartOfLast4Weeks: (tz: string) => {
    // 28 hari yang lalu dari awal hari ini di zona waktu user
    return dayjs().tz(tz).startOf("day").subtract(28, "day").toDate();
  }
};