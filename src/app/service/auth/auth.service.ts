import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore'; // Importa Firestore para obter dados do usuário

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore); // Injeta Firestore para acessar os dados do usuário
  private isAuthenticated: boolean = false;

  constructor(private router: Router) {
    // Observa mudanças no estado da autenticação
    onAuthStateChanged(this.auth, (user) => {
      this.isAuthenticated = !!user;
    });
  }

  /**
   * Realiza login e redireciona o usuário com base no tipo de conta.
   * @param email Email do usuário
   * @param password Senha do usuário
   */
  async login(email: string, password: string) {
    try {
      // Realiza login no Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Login bem-sucedido!');

      // Obtém informações adicionais sobre o usuário do Firestore
      const userDoc = doc(this.firestore, `users/${userCredential.user.uid}`);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data() as { role: string }; // Supondo que há uma propriedade 'role' no Firestore
        console.log('Tipo de conta:', userData.role);

        // Redireciona o usuário com base no tipo de conta
        this.navigateByRole(userData.role);
      } else {
        console.error('Dados do usuário não encontrados no Firestore');
        alert('Erro: Informações do usuário não encontradas.');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      alert('Erro ao fazer login: Verifique suas credenciais.');
    }
  }

  /**
   * Redireciona o usuário com base no tipo de conta.
   * @param role Tipo de conta do usuário
   */
  private navigateByRole(role: string) {
    switch (role) {
      case 'admin':
        this.router.navigate(['/admin']);
        break;
      case 'Operador':
        this.router.navigate(['/operador']);
        break;
      case 'Painel':
        this.router.navigate(['/painel']);
        break;
      default:
        this.router.navigate(['/default']);
    }
  }

  /**
   * Realiza logout e redireciona para a página de login.
   */
  async sair() {
    try {
      await signOut(this.auth);
      console.log('Saiu com sucesso');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  }

  /**
   * Verifica se o usuário está autenticado.
   * @returns Retorna true se o usuário estiver autenticado, false caso contrário.
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }
}
