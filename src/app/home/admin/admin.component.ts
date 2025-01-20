import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { get, ref, remove, set } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import{ jsPDF} from 'jspdf';

interface RelatorioItem {
  operador: string;
  guiche: string;
  senha: string;
  duracaoAtendimento: number;
  nota: number;
  dia: number;
  mes: number;
  semana: number;
  dataCompleta:Date;
  finalatendimento: number;
  horachamada: number;
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
   filtroDia: string = '';
   filtroOperador: string = '';
   filtroGuiche: string = '';
   filtroSenha: string = '';
   filtroNota: string = '';
   filtroMes: string = '';  
   filtroSemana: string = ''; 
 
   // Armazenar listas de valores únicos para cada coluna
   operadores: string[] = [];
   guichesList: string[] = [];
   senhasList: string[] = [];
   notasList: number[] = [];
   diasList: number[] = [];
  
  // Dados armazenados para o relatório
  dadosArray: RelatorioItem[] = [];
  
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
    const setores = this.setores.value.map((setor: any) => setor.nomeSetor);
    const guiches = this.guiches.value.map((guiche: any) => guiche.nomeGuiche);
    const nome = this.formulario.value.nome;
    const corretor = this.formulario.value.corretor;
    const timestamp = new Date().getTime(); // Pega o timestamp atual

    // Monta o caminho para salvar no Firebase
    const caminho = `avelar/${setores[0]}/${timestamp}`; // Utiliza o primeiro setor como nome

    // Salva no Firebase
    set(ref(this.db, caminho), {
      nome,
      corretor,
      
      guiches,
      data: timestamp
    })
    .then(() => {
      console.log('Dados salvos com sucesso no Firebase!');
    })
    .catch((error) => {
      console.error('Erro ao salvar os dados:', error);
    });
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
    const dadosArray: RelatorioItem[] = [];
    const senhaRef = ref(this.db, `avelar/senhafinalizada`);
    const snapshot = await get(senhaRef);

    if (snapshot.exists()) {
      const dados = snapshot.val() as Record<string, RelatorioItem>;
      console.log('Relatório de Senhas Finalizadas:', dados);

      // Itera sobre as chaves (milissegundos) e converte para data completa
      Object.entries(dados).forEach(([timestamp, item]) => {
        const data = new Date(Number(timestamp)); // Converte o timestamp em milissegundos para uma data
        const finalAtendimento = Number(item.finalatendimento);
        const horaChamada = Number(item.horachamada);
        
        // Calcula a duração do atendimento
        const duracaoAtendimento = finalAtendimento - horaChamada;

        
        dadosArray.push({
          ...item,
          dia: data.getDate(), // Adiciona o dia (1-31)
          mes: data.getMonth() + 1, // Adiciona o mês (1-12)
          semana: this.getSemanaDoAno(data), // Adiciona a semana
          dataCompleta: data, // Mantém a data completa para uso futuro
          duracaoAtendimento, // Adiciona a duração do atendimento
        });
      });

      if (dadosArray.length > 0) {
        // Preencher os filtros com os valores únicos
        this.operadores = [...new Set(dadosArray.map((item) => item.operador))];
        this.guichesList = [...new Set(dadosArray.map((item) => item.guiche))];
        this.senhasList = [...new Set(dadosArray.map((item) => item.senha))];
        this.notasList = [...new Set(dadosArray.map((item) => Number(item.nota)))];
        this.diasList = [...new Set(dadosArray.map((item) => item.dia))];

        // Gerar a tabela com a filtragem
        this.relatorio = this.formatarRelatorioEmTabela(dadosArray);
      } else {
        console.log('Nenhum dado encontrado.');
        this.relatorio = '<p>Nenhum dado encontrado.</p>';
      }
    } else {
      console.log('Nenhum dado encontrado.');
      this.relatorio = '<p>Nenhum dado encontrado.</p>';
    }
  } catch (error) {
    console.error('Erro ao recuperar os dados do relatório:', error);
    this.relatorio = '<p>Erro ao recuperar os dados do relatório.</p>';
  }
}

// Função para calcular a semana do ano (ISO 8601)
getSemanaDoAno(data: Date): number {
  const primeiroDiaDoAno = new Date(data.getFullYear(), 0, 1);
  const diasAteHoje = Math.floor((data.getTime() - primeiroDiaDoAno.getTime()) / (1000 * 3600 * 24));
  return Math.ceil((diasAteHoje + 1) / 7);
}

// Função para formatar os dados em uma tabela HTML com filtro de seleção
formatarRelatorioEmTabela(dados: RelatorioItem[]): string {
  let tabelaHTML = `<table class="table table-bordered">
                      <thead>
                        <tr>
                          <th>Dia</th>
                          <th>Mês</th>
                          <th>Semana</th>
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
      (this.filtroDia ? valor.dia === Number(this.filtroDia) : true) &&
      (this.filtroMes ? valor.mes === Number(this.filtroMes) : true) &&
      (this.filtroSemana ? valor.semana === Number(this.filtroSemana) : true) &&
      (this.filtroOperador ? valor.operador === this.filtroOperador : true) &&
      (this.filtroGuiche ? valor.guiche === this.filtroGuiche : true) &&
      (this.filtroSenha ? valor.senha === this.filtroSenha : true) &&
      (this.filtroNota ? valor.nota === Number(this.filtroNota) : true)
    ) {
      tabelaHTML += `<tr>
                      <td>${valor.dia || 'Não informado'}</td>
                      <td>${valor.mes || 'Não informado'}</td>
                      <td>${valor.semana || 'Não informado'}</td>
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
  } else if (filtro === 'dia') {
    this.filtroDia = '';
  } else if (filtro === 'mes') {
    this.filtroMes = '';
  } else if (filtro === 'semana') {
    this.filtroSemana = '';
  }
  this.exibirRelatorio(); // Atualiza o relatório com o filtro removido
}

async apagarBanco(): Promise<void> {
  try {
    const senhaRef = ref(this.db, `avelar/`); // Caminho do nó a ser apagado
    await remove(senhaRef); // Remove todos os dados do nó
    console.log('Dados do banco apagados com sucesso.');
    this.relatorio = '<p>Banco de dados apagado com sucesso.</p>';
  } catch (error) {
    console.error('Erro ao apagar o banco de dados:', error);
    this.relatorio = '<p>Erro ao apagar o banco de dados.</p>';
  }
}
async confirmarApagarBanco(): Promise<void> {
  const confirmar = window.confirm('Tem certeza que deseja apagar todos os dados do banco? Esta ação não pode ser desfeita.');
  if (confirmar) {
    await this.apagarBanco();
  }
}
}
