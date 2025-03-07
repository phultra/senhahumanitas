import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { get, ref, remove, set } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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
      {
        this.form();
        this.adicionarSetor();
      }
    }
    
    form() {
      this.formulario = this.formBuilder.group({
       //nome: ['', [Validators.required, Validators.minLength(6)]],
       // corretor: ['', [Validators.required, Validators.minLength(8)]],
        setores: this.formBuilder.array([]),
        //iches: this.formBuilder.array([]),
        status: ['', [Validators.required]],
        sigla: ['', [Validators.required, Validators.maxLength(3)]]   
      });
    }
 
  get setores(): FormArray {
      return this.formulario.get('setores') as FormArray;
    }
  
 /* removerSetor(index: number) {
    this.setores.removeAt(index);
    this.mostrarSigla = false;
  }*/


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
      nomeSetor: ['', Validators.required],
      sigla: ['', [Validators.required]] 
    });
  }

  async cadastrar() {
    const setores = this.setores.value.map((setor: { nomeSetor: string; sigla: string }) => ({
      nomeSetor: setor.nomeSetor?.trim() || '',
      sigla: setor.sigla?.trim() || ''
    }));
  
    const status = this.formulario.get('status')?.value?.trim() || ''; 
    const timestamp = new Date().getTime(); 
  
    console.log('Status:', status); 
    console.log('Setores:', setores);
  
    if (setores.some((setor: { nomeSetor: string; sigla: string; }) => setor.nomeSetor === '' || setor.sigla === '')) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome do Setor e Sigla).');
      return;
    }
  
    if (!status) {
      alert('Por favor, preencha o campo "status".');
      return;
    }
  
    try {
      const setoresRef = ref(this.db, `avelar/setor`);
      const snapshot = await get(setoresRef);
  
      if (snapshot.exists()) {
        const setoresExistentes = snapshot.val() as Record<string, any>;
  
        const setorOuSiglaDuplicado = setores.some((setor: { nomeSetor: string; sigla: string; }) =>
          Object.values(setoresExistentes).some((item: any) => 
            item.setor.toLowerCase() === setor.nomeSetor.toLowerCase() || 
            item.sigla.toLowerCase() === setor.sigla.toLowerCase()
          )
        );
  
        if (setorOuSiglaDuplicado) {
          alert('Já existe um setor ou sigla igual cadastrada.');
          return;
        }
      }
  
      for (const setor of setores) {
        const caminho = `avelar/setor/${timestamp}`;
  
        await set(ref(this.db, caminho), {
          setor: setor.nomeSetor,
          sigla: setor.sigla,
          status,
          data: timestamp,
        });
      }
  
      // Limpar apenas os valores dos campos
      for (let i = 0; i < this.setores.length; i++) {
        this.setores.at(i).patchValue({
          nomeSetor: '',
          sigla: ''
        });
      }
  
      // Limpar o campo "status" do formulário
      this.formulario.get('status')?.patchValue('');
  
      // Reseta a flag e limpa os setores se necessário
      this.mostrarSigla = false;
  
      console.log('Dados salvos com sucesso no Firebase!');
      alert('Dados cadastrados com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar os dados:', error);
      alert('Erro ao salvar os dados. Verifique o console para mais detalhes.');
    }
  }
}