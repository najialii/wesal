<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

class BusinessUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'tax_id' => 'nullable|string|max:50',
            'currency' => 'nullable|string|max:3',
            'timezone' => 'nullable|string|max:50',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Business name is required',
            'name.max' => 'Business name must not exceed 255 characters',
            'email.required' => 'Business email is required',
            'email.email' => 'Business email must be a valid email address',
            'phone.max' => 'Phone number must not exceed 20 characters',
            'address.max' => 'Address must not exceed 500 characters',
            'city.max' => 'City must not exceed 100 characters',
            'country.max' => 'Country must not exceed 100 characters',
            'tax_id.max' => 'Tax ID must not exceed 50 characters',
            'currency.max' => 'Currency code must not exceed 3 characters',
            'timezone.max' => 'Timezone must not exceed 50 characters',
        ];
    }
}
