import { useState } from "react";

export default function Field({ label, id, type = "text", ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          {...props}
          className={`block h-[52px] w-full rounded-[14px] border border-ink/15 bg-white px-4 text-base outline-none transition-shadow focus:border-ink focus:ring-2 focus:ring-brand/25 ${isPassword ? "pr-16" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="press absolute inset-y-0 right-0 flex w-16 items-center justify-center text-[13px] font-semibold text-muted hover:text-ink"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
}
