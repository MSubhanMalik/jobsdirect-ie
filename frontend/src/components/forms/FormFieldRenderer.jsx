import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function FormFieldRenderer({ field, value, onChange, required = false, disabled = false, inputRef = null }) {
  const wrapperClassName = field.span === 2 ? "sm:col-span-2" : "";

  if (field.type === "boolean") {
    return (
      <div className={`flex items-center justify-between rounded-lg border p-3 ${wrapperClassName}`}>
        <div className="pr-4">
          <Label>{field.label}</Label>
          {field.description ? <p className="mt-1 text-xs text-muted-foreground">{field.description}</p> : null}
        </div>
        <Switch checked={Boolean(value)} onCheckedChange={onChange} disabled={disabled} />
      </div>
    );
  }

  const label = required && field.supportsRequired !== false ? `${field.label} *` : field.label;

  return (
    <div className={`space-y-2 ${wrapperClassName}`}>
      <Label>{label}</Label>

      {field.type === "textarea" ? (
        <Textarea
          ref={inputRef}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          className={field.rows ? undefined : "min-h-[120px]"}
          rows={field.rows}
          disabled={disabled}
          required={required}
          {...field.inputProps}
        />
      ) : null}

      {field.type === "select" ? (
        <Select
          value={value || undefined}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {field.type !== "textarea" && field.type !== "select" ? (
        <Input
          ref={inputRef}
          type={field.type === "email" || field.type === "number" || field.type === "date" || field.type === "url" ? field.type : "text"}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          required={required}
          {...field.inputProps}
        />
      ) : null}

      {field.description ? <p className="text-xs text-muted-foreground">{field.description}</p> : null}
    </div>
  );
}
