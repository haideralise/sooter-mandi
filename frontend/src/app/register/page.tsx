'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { apiErrorMessage, apiFieldErrors } from '@/lib/api-error';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  city: '',
  organization_name: '',
};

export default function Register() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password_confirmation: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password_confirmation,
        city: form.city || undefined,
        organization_name: form.organization_name || undefined,
      });
      toast.success('Account created');
      router.replace('/dashboard');
    } catch (error: any) {
      setFieldErrors(apiFieldErrors(error));
      toast.error(apiErrorMessage(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const field = (
    key: keyof typeof EMPTY_FORM,
    label: string,
    type = 'text',
    opts: { required?: boolean; placeholder?: string } = {}
  ) => (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
        {!opts.required && <span className="text-neutral-400 font-normal"> (optional)</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={update(key)}
        required={opts.required}
        placeholder={opts.placeholder}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
          fieldErrors[key] ? 'border-alert-500' : 'border-neutral-300'
        }`}
      />
      {fieldErrors[key] && (
        <p className="text-sm text-alert-600 mt-1">{fieldErrors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900">🧵</h1>
          <h2 className="text-2xl font-bold text-neutral-900 mt-2">Create your account</h2>
          <p className="text-neutral-600 mt-2">Track live thread rates</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('name', 'Full name', 'text', { required: true, placeholder: 'Muhammad Ali' })}
          {field('email', 'Email', 'email', { required: true, placeholder: 'you@example.com' })}
          {field('phone', 'Phone', 'tel', { required: true, placeholder: '03001234567' })}
          {field('password', 'Password', 'password', { required: true, placeholder: 'At least 8 characters' })}
          {field('password_confirmation', 'Confirm password', 'password', { required: true })}
          {field('city', 'City', 'text', { placeholder: 'Faisalabad' })}
          {field('organization_name', 'Organization', 'text', { placeholder: 'Ali Textile Mills' })}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
          <p className="text-neutral-600 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
