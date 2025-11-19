import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[appCpfMask]',
    standalone: true
})
export class CpfMaskDirective {
    constructor(private el: ElementRef) { }

    @HostListener('input', ['$event'])
    onInput(event: any): void {
        let value = event.target.value.replace(/\D/g, '');

        if (value.length > 11) {
            value = value.substring(0, 11);
        }

        if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d)/, '$1.$2');
        }
        if (value.length > 7) {
            value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
        }
        if (value.length > 11) {
            value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
        }

        this.el.nativeElement.value = value;
    }
}
