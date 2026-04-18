"use client";

import React, { useId } from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id: externalId, className = "", ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const hasError = Boolean(error);

    const describedBy = [
      hasError ? errorId : null,
      helperText && !hasError ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1">
        {label ? (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={id}
          aria-invalid={hasError}
          aria-describedby={describedBy}
          className={[
            "rounded border px-3 py-2 text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            hasError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-blue-500",
            "disabled:bg-gray-100 disabled:cursor-not-allowed",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {hasError ? (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {helperText && !hasError ? (
          <p id={helperId} className="text-sm text-gray-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
