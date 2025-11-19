import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
    /**
     * Valida CPF brasileiro
     */
    static cpf(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const cpf = control.value?.replace(/\D/g, '');

            if (!cpf || cpf.length !== 11) {
                return { cpf: true };
            }

            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1+$/.test(cpf)) {
                return { cpf: true };
            }

            // Valida primeiro dígito verificador
            let sum = 0;
            for (let i = 0; i < 9; i++) {
                sum += parseInt(cpf.charAt(i)) * (10 - i);
            }
            let digit = 11 - (sum % 11);
            if (digit >= 10) digit = 0;
            if (digit !== parseInt(cpf.charAt(9))) {
                return { cpf: true };
            }

            // Valida segundo dígito verificador
            sum = 0;
            for (let i = 0; i < 10; i++) {
                sum += parseInt(cpf.charAt(i)) * (11 - i);
            }
            digit = 11 - (sum % 11);
            if (digit >= 10) digit = 0;
            if (digit !== parseInt(cpf.charAt(10))) {
                return { cpf: true };
            }

            return null;
        };
    }

    /**
     * Valida telefone brasileiro (fixo ou celular)
     */
    static phone(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const phone = control.value?.replace(/\D/g, '');

            if (!phone) {
                return null;
            }

            // Telefone deve ter 10 (fixo) ou 11 (celular) dígitos
            if (phone.length !== 10 && phone.length !== 11) {
                return { phone: true };
            }

            return null;
        };
    }

    /**
     * Valida senha forte
     */
    static strongPassword(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;

            if (!value) {
                return null;
            }

            const hasNumber = /[0-9]/.test(value);
            const hasLetter = /[a-zA-Z]/.test(value);
            const hasMinLength = value.length >= 6;

            const passwordValid = hasNumber && hasLetter && hasMinLength;

            return passwordValid ? null : { strongPassword: true };
        };
    }

    /**
     * Valida se dois campos são iguais (ex: senha e confirmação)
     */
    static matchFields(field1: string, field2: string): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value1 = control.get(field1)?.value;
            const value2 = control.get(field2)?.value;

            if (value1 !== value2) {
                control.get(field2)?.setErrors({ matchFields: true });
                return { matchFields: true };
            }

            return null;
        };
    }
}
