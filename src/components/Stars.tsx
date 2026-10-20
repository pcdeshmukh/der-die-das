export function Stars({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span class="stars" aria-label={`${value} / ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span class={i < value ? 'star on' : 'star'}>★</span>
      ))}
    </span>
  );
}
