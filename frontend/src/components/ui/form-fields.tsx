import * as React from "react"
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Eye, EyeOff } from "lucide-react"

interface BaseFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: FieldPath<T>
  label: string
  description?: string
  required?: boolean
  className?: string
}

interface TextFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  type?: "text" | "email" | "tel" | "url" | "date" | "time"
}

interface NumberFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
}

interface PasswordFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
}

interface TextareaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  rows?: number
}

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
}

interface CheckboxFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  description?: string
}

export function TextField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required = false,
  placeholder,
  type = "text",
  className,
}: TextFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function NumberField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required = false,
  placeholder,
  min,
  max,
  step = 0.01,
  prefix,
  suffix,
  className,
}: NumberFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <div className="relative">
              {prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {prefix}
                </span>
              )}
              <Input
                type="number"
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                className={cn(
                  prefix && "pl-8",
                  suffix && "pr-8"
                )}
                {...field}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
              />
              {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {suffix}
                </span>
              )}
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function PasswordField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required = false,
  placeholder,
  className,
}: PasswordFieldProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                className="pr-10"
                {...field}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function TextareaField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required = false,
  placeholder,
  rows = 3,
  className,
}: TextareaFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function SelectField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  required = false,
  placeholder,
  options,
  className,
}: SelectFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function CheckboxField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  className,
}: CheckboxFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-row items-start space-x-3 space-y-0", className)}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="text-sm font-normal">
              {label}
            </FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}