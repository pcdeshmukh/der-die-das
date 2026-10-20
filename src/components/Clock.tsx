/** Analog clock face for the time game. */
export function Clock({ hour, minute }: { hour: number; minute: number }) {
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minuteAngle = minute * 6;
  return (
    <svg class="clock" viewBox="0 0 100 100" role="img" aria-label={`${hour}:${String(minute).padStart(2, '0')}`}>
      <circle cx="50" cy="50" r="46" class="clock-face" />
      {Array.from({ length: 12 }, (_, i) => (
        <line x1="50" y1="8" x2="50" y2={i % 3 === 0 ? 16 : 13} class="clock-tick" transform={`rotate(${i * 30} 50 50)`} />
      ))}
      <line x1="50" y1="50" x2="50" y2="27" class="clock-hour" transform={`rotate(${hourAngle} 50 50)`} />
      <line x1="50" y1="50" x2="50" y2="15" class="clock-minute" transform={`rotate(${minuteAngle} 50 50)`} />
      <circle cx="50" cy="50" r="3" class="clock-pin" />
    </svg>
  );
}
