import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errorMessage } from "../api";
import { btnPrimary } from "../ui";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import FormError from "../components/FormError";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your readings.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={onChange}
        />
        <Field
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={onChange}
        />
        <FormError>{error}</FormError>
        <button className={`${btnPrimary} !mt-6`} disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <Link
        to="/register"
        className="press mt-3 flex min-h-11 items-center justify-center text-[15px] font-medium text-muted"
      >
        New to Sweety? <b className="ml-1.5 text-ink">Create account</b>
      </Link>
    </AuthLayout>
  );
}
