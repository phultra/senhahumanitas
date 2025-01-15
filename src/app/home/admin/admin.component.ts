import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { get, ref } from 'firebase/database';
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
      const dadosArray: RelatorioItem[] = [];
      
      // Itera sobre os dias de 1 a 31
      for (let dia = 1; dia <= 31; dia++) {
        const senhaRef = ref(this.db, `avelar/senhafinalizada/${dia}`);
        const snapshot = await get(senhaRef);
    
        if (snapshot.exists()) {
          const dados = snapshot.val() as Record<string, RelatorioItem>; 
          console.log(`Relatório de Senhas Finalizadas para o dia ${dia}:`, dados);
    
          // Adiciona o dia aos dados do relatório
          const dadosDia = Object.values(dados).map((item: RelatorioItem) => ({
            ...item,
            dia: dia // Adiciona o dia ao item
          }));
          
          // Adiciona os dados do dia ao array
          dadosArray.push(...dadosDia);
        }
      }
  
      if (dadosArray.length > 0) {
        // Preencher os filtros com os valores únicos
        this.operadores = [...new Set(dadosArray.map((item) => item.operador))];
        this.guichesList = [...new Set(dadosArray.map((item) => item.guiche))];
        this.senhasList = [...new Set(dadosArray.map((item) => item.senha))];
        this.notasList = [...new Set(dadosArray.map((item) => Number(item.nota)))];
        this.diasList = [...new Set(dadosArray.map((item) => Number(item.dia)))];
  
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

    // Função para exportar o relatório para PDF
 /* baixarPdf() {
  const doc = new jsPDF();
  
  // Título do PDF
  doc.setFontSize(18);
  doc.text('Relatório de Senhas Finalizadas', 14, 20);

  // Definindo o ponto de início para a tabela
  const startY = 30;
  let currentY = startY;

  // Cabeçalho da tabela
  const headers = ['ID', 'Dia', 'Operador', 'Guiche', 'Senha', 'Duração Atendimento (ms)', 'Nota'];
  
  // Largura das colunas
  const columnWidths = [10, 20, 40, 40, 40, 40, 30]; // Defina larguras adequadas

  // Desenhando o cabeçalho da tabela
  headers.forEach((header, index) => {
    doc.text(header, 10 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), currentY);
  });

  currentY += 10; // Espaço para a linha de cabeçalho

  // Desenhando as linhas da tabela
  this.dadosArray.forEach((row, index) => {
    const rowData = [
      (index + 1).toString(),
      row.dia.toString(),
      row.operador,
      row.guiche,
      row.senha,
      row.duracaoAtendimento.toString(),
      row.nota.toString()
    ];

    rowData.forEach((data, colIndex) => {
      doc.text(data, 10 + columnWidths.slice(0, colIndex).reduce((a, b) => a + b, 0), currentY);
    });

    currentY += 10; // Aumenta a linha após cada linha de dados

    // Se a tabela for muito longa, adicionar uma nova página
    if (currentY > 270) {
      doc.addPage();
      currentY = 20; // Redefine a posição inicial para a nova página
      headers.forEach((header, index) => {
        doc.text(header, 10 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), currentY);
      });
      currentY += 10; // Espaço para a linha de cabeçalho
    }
  });

  // Salvar o arquivo PDF
  doc.save('relatorio_senhas.pdf');
}*/


  // Função para formatar os dados em uma tabela HTML com filtro de seleção
  formatarRelatorioEmTabela(dados: RelatorioItem[]): string {
    let tabelaHTML = `<table class="table table-bordered">
                        <thead>
                          <tr>
                            
                            <th>Dia</th>
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
        (this.filtroOperador ? valor.operador === this.filtroOperador : true) &&
        (this.filtroGuiche ? valor.guiche === this.filtroGuiche : true) &&
        (this.filtroSenha ? valor.senha === this.filtroSenha : true) &&
        (this.filtroNota ? valor.nota === Number(this.filtroNota) : true)&&
        (this.filtroMes ? this.getMes(valor.dia) === Number(this.filtroMes) : true) &&  // Filtro por Mês
        (this.filtroSemana ? this.getSemanaDoAno(valor.dia) === Number(this.filtroSemana) : true)
      ) {
        tabelaHTML += `<tr>
                        
                         <td>${valor.dia || 'Não informado'}</td>
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
 // Função para pegar o mês a partir do dia
 getMes(dia: number): number {
  const data = new Date(2025, 0, dia); // Ano arbitrário para converter o dia em data
  return data.getMonth() + 1;  // Retorna o mês (1-12)
}

// Função para calcular a semana do ano (ISO 8601)
getSemanaDoAno(dia: number): number {
  const data = new Date(2025, 0, dia); // Ano arbitrário
  const primeiroDiaDoAno = new Date(data.getFullYear(), 0, 1);
  const diasAteHoje = Math.floor((data.getTime() - primeiroDiaDoAno.getTime()) / (1000 * 3600 * 24));
  return Math.ceil((diasAteHoje + 1) / 7);
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

  

}
