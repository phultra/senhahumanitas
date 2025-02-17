import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { get, ref, remove, set } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import{ jsPDF} from 'jspdf';
import { MenuComponent } from "../menu/menu/menu.component";
//import { AuthService } from '../service/auth/auth.service';
//import { createUserWithEmailAndPassword, getAuth } from '@angular/fire/auth';
//import { MenuComponent } from "./menu/menu/menu.component";

@Component({
  selector: 'app-setores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MenuComponent],
  templateUrl: './setores.component.html',
  styleUrl: './setores.component.scss'
})
export class SetoresComponent {
  
  mostrarSigla: boolean = false;
  formulario!: FormGroup;
  

  constructor(
      private formBuilder: FormBuilder,
      private db: Database,
      
    ) {}
    
    
    ngOnInit() {
      // Verifica se o usuário está autenticado ao carregar o componente
      {
        this.form();
      }
    }
    
    form() {
      this.formulario = this.formBuilder.group({
       //nome: ['', [Validators.required, Validators.minLength(6)]],
       // corretor: ['', [Validators.required, Validators.minLength(8)]],
        setores: this.formBuilder.array([]),
        //iches: this.formBuilder.array([]),
       // status: ['', [Validators.required]],
        sigla: ['', [Validators.required]]   
      });
    }
 
  get setores(): FormArray {
      return this.formulario.get('setores') as FormArray;
    }
  
  removerSetor(index: number) {
    this.setores.removeAt(index);
    this.mostrarSigla = false;
  }


  adicionarSetor() {
    if (this.setores.length > 0) { // Verifica se já existe um setor
      alert("Completa o cadastro do setor antes da fazer um novo");
    } else {
      const setor = this.novoSetor();
      this.setores.push(setor);
      this.mostrarSigla = true;
    }
  }

novoSetor(): FormGroup {
    return this.formBuilder.group({
      nomeSetor: ['', Validators.required]
    });
  }

async cadastrar() {
    const setores = this.setores.value.map((setor: any) => setor.nomeSetor.trim());
    //const guiches = this.guiches.value.map((guiche: any) => guiche.nomeGuiche);
    //const nome = this.formulario.value.nome.trim();
    //const corretor = this.formulario.value.corretor.trim();
    const sigla = this.formulario.value.sigla.trim()
    const status = this.formulario.value.status; // Obtém o valor do campo status
    const timestamp = new Date().getTime(); // Pega o timestamp atual
  
    console.log('Status:', status); // Verifica o valor de status
  
    // Verificar se algum setor está vazio
    if (setores.some((setor: string) => setor === '')) {
      alert('Por favor, preencha o nome de todos os setores antes de cadastrar.');
      return;
    }
  
    // Verificar se o status está preenchido
    /*if (status === undefined || status === null || status === '') {
      console.error('O campo "status" está vazio ou indefinido!');
      alert('Por favor, preencha o campo "status" antes de cadastrar.');
      return; // Evita salvar no Firebase se o status não estiver definido
    }*/
  
    // Verificar se o nome e corretor estão preenchidos
    if ( !sigla) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
  
    try {
      // Referência ao nó 'setor' no Firebase
      const setoresRef = ref(this.db, `avelar/setor`);
      const snapshot = await get(setoresRef);
  
      if (snapshot.exists()) {
        const setoresExistentes = snapshot.val() as Record<string, any>;
  
        // Verificar duplicidade ignorando maiúsculas e minúsculas
        const setorDuplicado = Object.values(setoresExistentes).some(
          (item: any) => item.setor.toLowerCase() === setores[0].toLowerCase()
        );
  
        if (setorDuplicado) {
          alert('Já existe um setor com este nome cadastrado.');
          return;
        }
      }
  
      // Monta o caminho para salvar no Firebase
      const caminho = `avelar/setor/${timestamp}`;
  
      // Salva no Firebase
      await set(ref(this.db, caminho), {
        //nome,
        //corretor,
        setor: setores.length > 0 ? setores[0] : '', // Pega o nome do primeiro setor
        status,
        sigla,
        data: timestamp,
      });
   // Limpar os campos após o cadastro
   this.formulario.reset(); // Reseta o formulário
   this.mostrarSigla = false; // Reseta a flag mostrarSigla (se necessário)
   
   for (let i = this.setores.length - 1; i >= 0; i--) {
    this.removerSetor(i); // Chama a função removerSetor passando o índice de cada setor
  }

      console.log('Dados salvos com sucesso no Firebase!');
      alert('Dados cadastrados com sucesso!');
    } catch (error) {
      console.error('Erro ao verificar ou salvar os dados:', error);
      alert('Erro ao salvar os dados. Verifique o console para mais detalhes.');
    }
  }
}
