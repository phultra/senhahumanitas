import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { get, ref } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class AdminComponent implements OnInit {
  
  formulario!: FormGroup;
  relatorio: string = '';
  constructor(
    private formBuilder: FormBuilder,
    private db: Database,
    private router: Router
  ) {}

  ngOnInit() {
    this.form();
  }

  get setores(): FormArray {
    return this.formulario.get('setores') as FormArray;
  }

  get guiches(): FormArray {
    return this.formulario.get('guiches') as FormArray;
  }

  novoSetor(): FormGroup {
    return this.formBuilder.group({
      nomeSetor: ['', Validators.required]
    });
  }

  novoGuiche(): FormGroup {
    return this.formBuilder.group({
      nomeGuiche: ['', Validators.required]
    });
  }

  adicionarSetor() {
    this.setores.push(this.novoSetor());
  }

  adicionarGuiche() {
    this.guiches.push(this.novoGuiche());
  }

  removerSetor(index: number) {
    this.setores.removeAt(index);
  }

  removerGuiche(index: number) {
    this.guiches.removeAt(index);
  }

  cadastrar() {
    console.log(this.formulario.value);
  }

  form() {
    this.formulario = this.formBuilder.group({
      nome: ['', [Validators.required, Validators.minLength(6)]],
      corretor: ['', [Validators.required, Validators.minLength(8)]],
      setores: this.formBuilder.array([]),
      guiches: this.formBuilder.array([]),
    });
  }

  // Função para exibir o relatório
  async exibirRelatorio() {
    try {
      const dia = new Date().getDate(); // Obtém o dia atual
      const senhaRef = ref(this.db, `avelar/senhafinalizada/${dia}`);
      const snapshot = await get(senhaRef);
  
      if (snapshot.exists()) {
        const dados = snapshot.val();
        console.log('Relatório de Senhas Finalizadas:', dados);
  
        // Formatar os dados para exibição como texto
        this.relatorio = this.formatarDados(dados);
      } else {
        console.log('Nenhum dado encontrado.');
        this.relatorio = 'Nenhum dado encontrado.';
      }
    } catch (error) {
      console.error('Erro ao recuperar os dados do relatório:', error);
      this.relatorio = 'Erro ao recuperar os dados do relatório.';
    }
  }
  
  // Função para formatar os dados em texto simples
  formatarDados(dados: any): string {
    let texto = '';
  
    for (const chave in dados) {
      if (dados.hasOwnProperty(chave)) {
        const valor = dados[chave];
  
        // Se o valor for um objeto (e não for um valor simples como string, número, etc.)
        if (typeof valor === 'object' && valor !== null) {
          texto += `${chave}:\n${this.formatarDados(valor)}`; // Chama recursivamente para formatar o objeto
        } else if (valor !== '' && valor !== false && valor !== null) {
          texto += `${chave}: ${valor}\n`; // Formata como texto
        }
      }
    }
  
    return texto || 'Nenhum dado disponível.';
  }

}
