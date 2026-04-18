"use client";

import React from "react";
import { Input } from "./Input";

export interface FormFieldProps {
  name: string;
  label?: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function FormField({
  name,
  label,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled,
}: FormFieldProps) {
  return (
    <Input
      name={name}
      label={label ? `${label}${required ? " *" : ""}` : undefined}
      type={type}
      value={value}
      onChange={onChange}
      error={error}
      required={required}
      placeholder={placeholder}
      disabled={disabled}
      aria-required={required}
    />
  );
}
