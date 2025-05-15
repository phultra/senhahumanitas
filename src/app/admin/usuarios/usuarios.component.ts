import { Component } from '@angular/core';

import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { get, ref, remove, set } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { MenuComponent } from "../menu/menu/menu.component";
//import{ jsPDF} from 'jspdf';
//import { AuthService } from '../service/auth/auth.service';
//import { createUserWithEmailAndPassword, getAuth } from '@angular/fire/auth';


@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MenuComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent {
  formularioUsuario!: FormGroup;
  

  constructor(
    private formBuilder: FormBuilder,
    private db: Database,
    
  ) {}

  ngOnInit() {
    // Verifica se o usuário está autenticado ao carregar o componente
    {
    
    this.formCadastroUsuario();
    }
  }

  formCadastroUsuario() {
    this.formularioUsuario = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      funcao: ['', [Validators.required]], // Campo para a função do usuário
     
    });
  }


  // Função para o cadastro de um novo usuário
    async cadastrarUsuario() {
      if (this.formularioUsuario.invalid) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
      }
    
      const { nome, email, senha, funcao } = this.formularioUsuario.value;
      
      try {
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;
    
        const userRef = ref(this.db, 'usuarios/' + user.uid);
        await set(userRef, {
          nome: nome,
          email: user.email,
          funcao: funcao,
          
          uid: user.uid,
        });
    
        alert('Usuário cadastrado com sucesso!');
        this.formularioUsuario.reset();
        //this.router.navigate(['/login']);
      } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        alert('Erro ao cadastrar o usuário. Tente novamente.');
      }
    }




}
