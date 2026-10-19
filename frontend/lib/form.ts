import { AxiosError } from 'axios';
import { useState, ChangeEvent, FormEvent } from 'react';
import { ApiResponse } from './api/types';
import { redirect } from 'next/navigation';

// Menentukan tipe data generic untuk fleksibilitas struktur form
export function useForm<T>(initialValues: T, redirectTo?: string) {
  const [values, setValues] = useState<T>(initialValues);
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<ApiResponse['errors']>()

  const changeValue = <V>(name: string, value: V) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const handleChange = <V = string>(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      changeValue(name, (e.target as HTMLInputElement).checked);
    } else {
      changeValue(name, value as unknown as V);
    }
  };

  const setError = (name: string, error: string | string[]) => {
    setErrors((prev) => ({
      ...prev,
      [name]: Array.isArray(error) ? error : [error],
    }));
  }

  const resetForm = () => {
    setValues(initialValues);
    setErrors(undefined);
  };

  const handleSubmit = (callback: (values: T) => Promise<void>) => async (e: FormEvent) => {
    e.preventDefault();
    setIsPending(true)
    setErrors(undefined)
    try {
      await callback(values);
      // if (redirectTo) {
      //   redirect(redirectTo);
      // }
    } catch (error) {
      // console.log("Ada error", error.response)
      if (error instanceof AxiosError) {
        setErrors({...error.response?.data?.errors, message: [error.response?.data?.message || 'Terjadi kesalahan pada inputan']})
      } else {
        console.error(error)
        setErrors({ message: ['Terjadi kesalahan pada pemrosesan data']} )
      }
    } finally {
      setIsPending(false)
    }
  };

  return {
    values,
    isPending,
    errors,
    handleChange,
    changeValue,
    setError,
    resetForm,
    handleSubmit,
  };
}