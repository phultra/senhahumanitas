import { CanActivateFn, CanActivate, Router } from '@angular/router';
import { AuthService } from './service/auth/auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
 // return true;
    const authService = inject(AuthService);
    const router = inject(Router);
    const usuario = sessionStorage.getItem('id')
    if (usuario) {
      return true;
    } else {
      router.navigate(['/login']);
      return false;
    }
  }

