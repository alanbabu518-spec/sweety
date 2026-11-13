import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errorMessage } from "../api";
import { btnPrimary } from "../ui";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import FormError from "../components/FormError";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const meets = form.password.length >= 8;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="It takes a few seconds.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          id="name"
          name="name"
          label="Name"
          autoComplete="name"
          value={form.name}
          onChange={onChange}
        />
        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={onChange}
        />
        <div>
          <Field
            id="password"
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={onChange}
          />
          <p
            className={`mt-2 flex items-center gap-1.5 text-[13px] font-medium transition-colors ${meets ? "text-brand" : "text-muted"}`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            At least 8 characters
          </p>
        </div>
        <FormError>{error}</FormError>
        <button className={`${btnPrimary} !mt-6`} disabled={loading}>
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
      <Link
        to="/login"
        className="press mt-3 flex min-h-11 items-center justify-center text-[15px] font-medium text-muted"
      >
        Already have an account? <b className="ml-1.5 text-ink">Log in</b>
      </Link>
    </AuthLayout>
  );
}
