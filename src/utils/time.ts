export const timeToMinutes = (timeStr: string) => {
  try {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (h === 12) h = 0;
    let total = h * 60 + m;
    if (modifier === 'PM') total += 720;
    return total;
  } catch {
    return 360; 
  }
};
