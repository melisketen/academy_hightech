<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'last_read_page' => 'required|integer|min:1',
            'progress_percentage' => 'required|numeric|between:0,100',
        ];
    }
}
