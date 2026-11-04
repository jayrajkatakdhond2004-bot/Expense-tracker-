import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Field';
import Button from '../components/ui/Button';
import AuthLayout from './AuthLayout';
import { loginSchema } from '../utils/validation';

const DEMO = { email: 'demo@expense.app', password: 'Demo@1234' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setServerError(err.message);
    }
  };

  const fillDemo = () => {
    setValue('email', DEMO.email, { shouldValidate: true });
    setValue('password', DEMO.password, { shouldValidate: true });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see where your money goes."
      footer={
        <>
          New here?{' '}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300"
          >
            {serverError}
          </p>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full justify-center" loading={isSubmitting}>
          Log in
        </Button>
        <button
          type="button"
          onClick={fillDemo}
          className="w-full text-center text-sm text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
        >
          Use demo account
        </button>
      </form>
    </AuthLayout>
  );
}
