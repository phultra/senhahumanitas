import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { get, ref } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface RelatorioItem {
  operador: string;
  guiche: string;
  senha: string;
  duracaoAtendimento: number;
  nota: number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,FormsModule]
})
export class AdminComponent implements OnInit {
  
  formulario!: FormGroup;
  relatorio: string = '';
  
  
   // Filtros
   filtroOperador: string = '';
   filtroGuiche: string = '';
   filtroSenha: string = '';
   filtroNota: string = '';
 
   // Armazenar listas de valores únicos para cada coluna
   operadores: string[] = [];
   guichesList: string[] = [];
   senhasList: string[] = [];
   notasList: number[] = [];
  
  
  
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

        // Preencher os filtros com os valores únicos
        const dadosArray = Object.values(dados) as RelatorioItem[];
        this.operadores = [...new Set(dadosArray.map((item) => item.operador))];
        this.guichesList = [...new Set(dadosArray.map((item) => item.guiche))];
        this.senhasList = [...new Set(dadosArray.map((item) => item.senha))];
        this.notasList = [...new Set(dadosArray.map((item) => Number(item.nota)))];

        // Gerar a tabela com a filtragem
        this.relatorio = this.formatarRelatorioEmTabela(dadosArray);
      } else {
        console.log('Nenhum dado encontrado.');
        this.relatorio = '<p>Nenhum dado encontrado.</p>';
      }
    } catch (error) {
      console.error('Erro ao recuperar os dados do relatório:', error);
      this.relatorio = '<p>Erro ao recuperar os dados do relatório.</p>';
    }
  }

  // Função para formatar os dados em uma tabela HTML com filtro de seleção
  formatarRelatorioEmTabela(dados: RelatorioItem[]): string {
    let tabelaHTML = `<table class="table table-bordered">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Operador</th>
                            <th>Guiche</th>
                            <th>Senha</th>
                            <th>Duração Atendimento (ms)</th>
                            <th>Nota</th>
                          </tr>
                        </thead>
                        <tbody>`;

    // Itera sobre os dados e cria as linhas da tabela
    for (let i = 0; i < dados.length; i++) {
      const valor = dados[i];

      // Filtra as linhas conforme os valores selecionados
      if (
        (this.filtroOperador ? valor.operador === this.filtroOperador : true) &&
        (this.filtroGuiche ? valor.guiche === this.filtroGuiche : true) &&
        (this.filtroSenha ? valor.senha === this.filtroSenha : true) &&
        (this.filtroNota ? valor.nota === Number(this.filtroNota) : true)
      ) {
        tabelaHTML += `<tr>
                        <td>${i + 1}</td>
                        <td>${valor.operador || 'Não informado'}</td>
                        <td>${valor.guiche || 'Não informado'}</td>
                        <td>${valor.senha || 'Não informado'}</td>
                        <td>${valor.duracaoAtendimento || 'Não informado'}</td>
                        <td>${valor.nota || 'Não informado'}</td>
                      </tr>`;
      }
    }

    tabelaHTML += `</tbody></table>`;

    return tabelaHTML;
  }

  // Função chamada ao selecionar um filtro
  filtrarRelatorio() {
    this.exibirRelatorio(); // Recarrega o relatório com o filtro aplicado
  }

  // Função para remover o filtro
  removerFiltro(filtro: string) {
    if (filtro === 'operador') {
      this.filtroOperador = '';
    } else if (filtro === 'guiche') {
      this.filtroGuiche = '';
    } else if (filtro === 'senha') {
      this.filtroSenha = '';
    } else if (filtro === 'nota') {
      this.filtroNota = '';
    }
    this.exibirRelatorio(); // Atualiza o relatório com o filtro removido
  }
}
