import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'phone',
    standalone: true
})
export class PhonePipe implements PipeTransform {
    transform(value: string): string {
        if (!value) return '';

        // Remove caracteres não numéricos
        const phone = value.replace(/\D/g, '');

        // Formata celular: (XX) XXXXX-XXXX
        if (phone.length === 11) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }

        // Formata telefone fixo: (XX) XXXX-XXXX
        if (phone.length === 10) {
            return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }

        return value;
    }
}
