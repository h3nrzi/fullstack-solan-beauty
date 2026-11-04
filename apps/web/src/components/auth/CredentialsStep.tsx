import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface CredentialsStepProps {
  loading: boolean;
  onSubmit: (credentials: { username: string; password: string }) => Promise<void>;
}

export function CredentialsStep({ loading, onSubmit }: CredentialsStepProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="username"
        label="نام کاربری"
        type="text"
        required
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="مانند admin_manager"
        dir="ltr"
        className="text-left font-mono"
      />

      <Input
        id="password"
        label="رمز عبور"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        dir="ltr"
        className="text-left font-mono"
      />

      <Button type="submit" loading={loading} className="w-full">
        ادامه (مرحله دوم)
      </Button>
    </form>
  );
}
