import { inject, Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, onAuthStateChanged, signOut, getAuth, User } from '@angular/fire/auth';
import { get, getDatabase, ref } from '@angular/fire/database';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);

  private auth = inject(Auth);
  private isAuthenticated: boolean = false; // Adiciona propriedade para controle de autenticação
 
  constructor(
    private router: Router,
    private spinner: NgxSpinnerService

  ) {
    // Observa mudanças no estado da autenticação
    onAuthStateChanged(this.auth, (user) => {
      this.isAuthenticated = !!user; // Atualiza isAuthenticated quando o estado do usuário muda
      this.userSubject.next(user);
    });
  }

  async login(email: string, senha: string) {
  
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha).then(async dados=>{
        console.log(email);
        console.log(dados.user.uid);
        const user = dados.user
         // Buscar a função do usuário no banco de dados
        const db = getDatabase();
        const userRef = ref(db, 'usuarios/' + dados.user.uid);
        const snapshot = await get(userRef);
        console.log(snapshot);
        sessionStorage.setItem('id', dados.user.uid);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          localStorage.setItem('userRole', userData.funcao); // Salva a função no localStorage
          this.redirecionarUsuario(userData.funcao);
        } else {
          alert('Usuário não encontrado.');
        }
      })
     // const user = userCredential.user;

    } catch (error) {
      console.error('Erro ao fazer login:', error);
      alert('Erro ao fazer login. Verifique suas credenciais.');
    }
  }

  redirecionarUsuario(funcao: string) {
    if (funcao === 'admin') {
      this.spinner.hide();
      this.router.navigate(['/admin']);
    } else if (funcao === 'ChamaSenha') {
      this.spinner.hide();
      this.router.navigate(['/inicio']);
    } else if (funcao === 'Painel') {
      this.spinner.hide();
      this.router.navigate(['/painel']);
    } else if (funcao === 'operador') {
      this.spinner.hide();
      this.router.navigate(['/operador']);
    } else {
      // Caso a função não corresponda a nenhum dos casos acima
      console.log('Função não reconhecida, redirecionando para a página inicial');
      this.router.navigate(['/inicio']);
    }
  }

  logout() {
    const auth = getAuth();
    auth.signOut();
    localStorage.removeItem('userRole');
    sessionStorage.setItem('id', '');
    this.router.navigate(['/login']);
  }

  getUser(): Observable<User | null> {
    return new Observable(subscriber => {
      onAuthStateChanged(this.auth, user => {
        subscriber.next(user);
      });
    });
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
   }

}


