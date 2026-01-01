
import { useEffect, useRef } from 'react';
import { ScheduleDay, PeriodTime } from '../types';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const useSchoolBell = (
  periodTimes: PeriodTime[],
  schedule: ScheduleDay[],
  enabled: boolean
) => {
  // We'll use a simple ref to avoid rescheduling constantly in the same session
  const scheduledRef = useRef(false);

  // --- 1. Request Permissions ---
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions();
    }
  }, []);

  // --- 2. Schedule Notifications Logic ---
  useEffect(() => {
    if (!enabled) {
      // If disabled, clear all pending notifications
      if (Capacitor.isNativePlatform()) {
        LocalNotifications.cancel({ notifications: [] }).then(() => {
             // To clear all, we often need to know IDs, but pending() helps. 
             // Ideally we just clear the ones we set. 
             // For simplicity in this scope, we can try to cancel pending ones.
             LocalNotifications.getPending().then(pending => {
                 if (pending.notifications.length > 0) {
                     LocalNotifications.cancel({ notifications: pending.notifications });
                 }
             });
        });
      }
      return;
    }

    const scheduleBells = async () => {
        if (!Capacitor.isNativePlatform()) return; // Only for native apps

        // First, clear old ones to avoid duplicates
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
            await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        const daysMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        const now = new Date();
        const notificationsToSchedule: any[] = [];
        let idCounter = 1000;

        // Iterate through the next 7 days to schedule bells
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() + i);
            const dayIndex = date.getDay(); // 0=Sun, 1=Mon...
            
            // Map JS getDay() (0=Sun, 1=Mon) to our Schedule Array Index
            // Our schedule array usually matches [Sun, Mon, Tue, Wed, Thu]
            // If dayIndex is 5 (Fri) or 6 (Sat), skip
            if (dayIndex > 4) continue; 

            // Find the schedule for this day
            // Note: schedule[0] is Sunday, schedule[1] is Monday...
            const dailySchedule = schedule[dayIndex];
            
            if (!dailySchedule || dailySchedule.periods.every(p => !p)) continue;

            periodTimes.forEach((pt, pIndex) => {
                const className = dailySchedule.periods[pIndex];
                if (!className) return; // Free period, no bell needed? Or maybe "Free Time" alert. Let's alert only for classes.

                // Parse Time
                const [h, m] = pt.startTime.split(':').map(Number);
                if (isNaN(h) || isNaN(m)) return;

                const notificationTime = new Date(date);
                notificationTime.setHours(h, m, 0, 0);

                // If the time is in the past for TODAY, don't schedule it
                if (notificationTime <= new Date()) return;

                notificationsToSchedule.push({
                    id: idCounter++,
                    title: `حان موعد الحصة ${pt.periodNumber}`,
                    body: `لديك حصة ${className} الآن`,
                    schedule: { at: notificationTime },
                    sound: 'bell.wav', // Ensure this file exists in android/app/src/main/res/raw or use default
                    actionTypeId: "",
                    extra: null
                });
            });
        }

        if (notificationsToSchedule.length > 0) {
            await LocalNotifications.schedule({ notifications: notificationsToSchedule });
            console.log(`Scheduled ${notificationsToSchedule.length} bells.`);
        }
    };

    scheduleBells();

  }, [periodTimes, schedule, enabled]); // Re-run if schedule changes or toggle changes

  // --- 3. Web/Foreground Fallback ---
  // If the user is ON the web version or keeping the app OPEN, we can still use Audio
  // This acts as a backup and provides immediate feedback during use
  useEffect(() => {
      if (!enabled) return;

      const checkTime = () => {
          const now = new Date();
          const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          
          periodTimes.forEach((period) => {
              if (period.startTime === currentTime) {
                  // Play Sound if seconds are 00 (to avoid looping for a whole minute)
                  if (now.getSeconds() === 0) {
                      // Try playing system sound
                      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1085/1085-preview.mp3');
                      audio.play().catch(e => console.warn('Audio play blocked', e));
                      
                      // Web Notification
                      if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
                          new Notification('راصد - تذكير', { 
                              body: `بدأت الحصة ${period.periodNumber}`,
                              icon: '/icon.png'
                          });
                      }
                  }
              }
          });
      };

      // Request Web Permission once
      if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
      }

      const interval = setInterval(checkTime, 1000);
      return () => clearInterval(interval);
  }, [periodTimes, enabled]);
};
