export default function Field({ label, id, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold">{label}</label>
      <input
        id={id}
        {...props}
        className="block h-[52px] w-full rounded-[14px] border border-ink/15 bg-white px-4 text-base outline-none transition-shadow focus:border-ink focus:ring-2 focus:ring-brand/25"
      />
    </div>
  );
}