import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[appPhoneMask]',
    standalone: true
})
export class PhoneMaskDirective {
    constructor(private el: ElementRef) { }

    @HostListener('input', ['$event'])
    onInput(event: any): void {
        let value = event.target.value.replace(/\D/g, '');

        if (value.length > 11) {
            value = value.substring(0, 11);
        }

        if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d)/, '($1) $2');
        }
        if (value.length > 7) {
            // Celular (11 dígitos)
            if (value.length === 11) {
                value = value.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3');
            }
            // Fixo (10 dígitos)
            else {
                value = value.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3');
            }
        }

        this.el.nativeElement.value = value;
    }
}
