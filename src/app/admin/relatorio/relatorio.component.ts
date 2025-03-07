import { Component, OnInit } from '@angular/core';
import { get, ref } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { CommonModule } from '@angular/common';
import { MenuComponent } from "../menu/menu/menu.component";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';



interface RelatorioItem {
  operador: string;
  guiche: string;
  senha: string;
  duracaoAtendimento: number;
  nota: number;
  dataCompleta: Date;
  finalatendimento: number;
  horachamada: number;
  setor: string;
  preferencial: boolean;
}

@Component({
  selector: 'app-relatorio',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, MenuComponent],
  templateUrl: './relatorio.component.html',
  styleUrl: './relatorio.component.scss'
})
export class RelatorioComponent {
  relatorio: string = '';
  mostrarRelatorio: boolean = false;
  dadosArray: RelatorioItem[] = [];

 
  filtroDia: string = '';
  filtroMes: string = '';
  filtroSemana: string = '';
  filtroOperador: string = '';
  filtroGuiche: string = '';
  filtroSenha: string = '';
  filtroNota: string = '';
  filtroSetor: string = '';
  filtroPreferencial: string = '';

  filtroDataInicio: string = '';
filtroDataFim: string = '';

  diasList: string[] = [];
  operadores: string[] = [];
  guichesList: string[] = [];
  senhasList: string[] = [];
  notasList: number[] = [];
  setoresList: string[] = [];
  preferencialList: string[] = [];

  mediaNotas: { operador: string, mediaNota: number, totalAtendimentos: number }[] = [];

  constructor(private db: Database) {}

  ngOnInit() {
    this.exibirRelatorio();
    console.log('Dados disponíveis:', this.relatorio);
  }

  fecharRelatorio() {
    this.mostrarRelatorio = false;
  }

  async exibirRelatorio() {
    try {
      this.mostrarRelatorio = true; // Exibe a área de relatório
      const dadosArray: RelatorioItem[] = [];
      const senhaRef = ref(this.db, `avelar/senhafinalizada`);
      const snapshot = await get(senhaRef);
  
      if (snapshot.exists()) {
        const dados = snapshot.val() as Record<string, RelatorioItem>;
        console.log('Relatório de Senhas Finalizadas:', dados);
  
        Object.entries(dados).forEach(([timestamp, item]) => {
          const data = new Date(Number(timestamp));
          const finalAtendimento = Number(item.finalatendimento);
          const horaChamada = Number(item.horachamada);
          const duracaoAtendimento = finalAtendimento - horaChamada;
  
          dadosArray.push({
            ...item,
            dataCompleta: data,
            duracaoAtendimento,
          });
        });
  
        if (dadosArray.length > 0) {
          // Definir as listas de filtros únicos
          this.operadores = [...new Set(dadosArray.map((item) => item.operador))];
          this.guichesList = [...new Set(dadosArray.map((item) => item.guiche))];
          this.senhasList = [...new Set(dadosArray.map((item) => item.senha))];
          this.notasList = [...new Set(dadosArray.map((item) => Number(item.nota)))];
          this.setoresList = [...new Set(dadosArray.map((item) => item.setor))];
          this.preferencialList = ['Sim', 'Não'];
          this.diasList = [...new Set(dadosArray.map((item) => item.dataCompleta.toLocaleDateString()))];
  
          // Aplicar filtros
          const dadosFiltrados = dadosArray.filter((valor) => {

            const dataAtendimento = valor.dataCompleta;

            const dataInicioValida = this.filtroDataInicio ? new Date(this.filtroDataInicio) : null;
            const dataFimValida = this.filtroDataFim ? new Date(this.filtroDataFim) : null;

            return (
              (!dataInicioValida || dataAtendimento >= dataInicioValida) &&
              (!dataFimValida || dataAtendimento <= dataFimValida) &&
              (this.filtroDia ? valor.dataCompleta.toLocaleDateString() === this.filtroDia : true) &&
              (this.filtroMes ? valor.dataCompleta.getMonth() + 1 === Number(this.filtroMes) : true) &&
              (this.filtroSemana ? this.getSemanaDoMes(valor.dataCompleta) === Number(this.filtroSemana) : true) &&
              (this.filtroOperador ? valor.operador === this.filtroOperador : true) &&
              (this.filtroGuiche ? valor.guiche === this.filtroGuiche : true) &&
              (this.filtroSenha ? valor.senha === this.filtroSenha : true) &&
              (this.filtroNota ? valor.nota === Number(this.filtroNota) : true) &&
              (this.filtroSetor ? valor.setor === this.filtroSetor : true) &&
              (this.filtroPreferencial ? valor.preferencial === (this.filtroPreferencial === 'Sim') : true)
            );
          });
  
          // Formatar os dados filtrados em uma tabela HTML
          if (dadosFiltrados.length > 0) {
            this.relatorio = this.formatarRelatorioEmTabela(dadosFiltrados);
          } else {
            console.log('Nenhum dado encontrado com os filtros aplicados.');
            this.relatorio = '<p>Nenhum dado encontrado.</p>';
          }
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


 
  calcularMediaNotas() {
    try {
      // Verificar se o relatório está disponível
      if (!this.relatorio) {
        console.error('Relatório não disponível');
        return;
      }
  
      // Criar uma array de objetos com os dados extraídos do relatório
      const div = document.createElement('div');
      div.innerHTML = this.relatorio; // Usando o HTML armazenado
  
      // Selecionar todas as linhas da tabela
      const rows = div.querySelectorAll('table tbody tr');
      const operadoresNotas = new Map<string, { totalNotas: number, totalAtendimentos: number }>();
  
      rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        const operador = cols[2]?.textContent?.trim();
        const nota = Number(cols[6]?.textContent?.trim());
        
        if (operador && !isNaN(nota)) {
          if (!operadoresNotas.has(operador)) {
            operadoresNotas.set(operador, { totalNotas: 0, totalAtendimentos: 0 });
          }
          
          const operadorData = operadoresNotas.get(operador)!;
          operadorData.totalNotas += nota;
          operadorData.totalAtendimentos++;
        }
      });
  
      // Calcular a média e preparar o resultado
      this.mediaNotas = Array.from(operadoresNotas.entries()).map(([operador, { totalNotas, totalAtendimentos }]) => {
        const media = totalNotas / totalAtendimentos;
        return {
          operador,
          mediaNota: media,  // Garantir que mediaNota seja um número
          totalAtendimentos
        };
      });
  
      console.log('Média de notas por operador:', this.mediaNotas);
    } catch (error) {
      console.error('Erro ao calcular a média de notas:', error);
    }
  }
  
  
 

  formatarRelatorioEmTabela(dados: RelatorioItem[]): string {
    let tabelaHTML = `
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">
        <table class="table-bordered" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Setor</th>
              <th>Data</th>
              <th>Operador</th>
              <th>Guichê</th>
              <th>Senha</th>
              <th>Duração Atendimento (ms)</th>
              <th>Nota</th>
              <th>Preferencial</th>
            </tr>
          </thead>
          <tbody>`;
  
    for (let i = 0; i < dados.length; i++) {
      const valor = dados[i];
      tabelaHTML += `<tr>
                        <td>${valor.setor || 'Não informado'}</td>
                        <td>${valor.dataCompleta.toLocaleDateString() || 'Não informado'}</td>
                        <td>${valor.operador || 'Não informado'}</td>
                        <td>${valor.guiche || 'Não informado'}</td>
                        <td>${valor.senha || 'Não informado'}</td>
                        <td>${valor.duracaoAtendimento || 'Não informado'}</td>
                        <td>${valor.nota || 'Não informado'}</td>
                        <td>${valor.preferencial ? 'Sim' : 'Não'}</td>
                      </tr>`;
    }
  
    tabelaHTML += `</tbody></table></div>`;
    return tabelaHTML;
  }

  

  getSemanaDoMes(data: Date): number {
    const dia = data.getDate();
    return Math.ceil(dia / 7);
  }

  filtrarRelatorio() {
    this.exibirRelatorio();
  }



  removerFiltro(filtro: string) {
    if (filtro === 'dia') {
      this.filtroDia = '';
    } else if (filtro === 'mes') {
      this.filtroMes = '';
    } else if (filtro === 'semana') {
      this.filtroSemana = '';
    } else if (filtro === 'operador') {
      this.filtroOperador = '';
    } else if (filtro === 'guiche') {
      this.filtroGuiche = '';
    } else if (filtro === 'senha') {
      this.filtroSenha = '';
    } else if (filtro === 'nota') {
      this.filtroNota = '';
    } else if (filtro === 'setor') {
      this.filtroSetor = '';
    } else if (filtro === 'preferencial') {
      this.filtroPreferencial = '';
    }
    this.exibirRelatorio();
  }

  

  async relatorioParaBaixar() {
    
    try {
      const setoresRef = ref(this.db, 'avelar/senhafinalizada');
      const snapshot = await get(setoresRef);
  
      if (snapshot.exists()) {
        const dados = snapshot.val();
        const dadosArray: RelatorioItem[] = Object.values(dados);
  
        if (dadosArray.length === 0) {
          alert('Nenhum dado encontrado para exportação.');
          return;
        }
  
        // Criar o documento PDF
        const doc = new jsPDF();
        doc.text('Relatório de Senhas Finalizadas', 14, 10);
   
        
        autoTable(doc, {
          startY: 20,
          head: [['Setor', 'Data', 'Operador', 'Guichê', 'Senha', 'Duração', 'Nota', 'Preferencial']],
          body: dadosArray.map(item => {
            // Verificando o valor de finalatendimento antes de tentar criar a data
            console.log("Valor de finalatendimento:", item.finalatendimento); 
            
            let dataFormatada = 'N/D'; // Valor padrão em caso de erro
            
            // Convertendo explicitamente para número (caso seja uma string numérica)
            let timestamp = Number(item.finalatendimento); 
            
            // Verificar se o valor é um número válido (timestamp)
            if (timestamp && !isNaN(timestamp)) {
              const data = new Date(timestamp);
              
              // Verificar se a data é válida
              if (!isNaN(data.getTime())) {
                dataFormatada = data.toLocaleDateString();
              }
            }
            
           
            
            let duracaoFormatada = 'N/D'; // Valor padrão em caso de erro
        
            // Verificar se finalAtendimento e horaChamada estão definidos e são números válidos
            let finalAtendimento = item.finalatendimento;
            let horaChamada = item.horachamada;
        
            if (finalAtendimento && horaChamada) {
              // Calcular a duração (em milissegundos)
              let duracao = finalAtendimento - horaChamada;
        
              // Verificar se a duração é válida
              if (!isNaN(duracao) && duracao > 0) {
                duracaoFormatada = duracao + 'ms';
              } else {
                console.log("Duração inválida (finalAtendimento ou horaChamada):", finalAtendimento, horaChamada);
              }
            } else {
              console.log("Valores inválidos para finalAtendimento ou horaChamada:", finalAtendimento, horaChamada);
            }
        
            return [
              item.setor || 'N/D',
              dataFormatada,
              item.operador || 'N/D',
              item.guiche || 'N/D',
              item.senha || 'N/D',
              duracaoFormatada,
              item.nota || 'N/D',
              item.preferencial ? 'Sim' : 'Não'
            ];
          }),
          theme: 'grid'
        });
        
        
        
        
  
        // Baixar o PDF
        doc.save(`relatorio_${new Date().toISOString().slice(0, 10)}.pdf`);
      } else {
        alert('Nenhum dado encontrado.');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o relatório em PDF.');
    }
  }
  


 // Função para gerar e baixar o PDF
 gerarPDFmedia() {
  // Verificar se temos dados para gerar o PDF
  if (this.mediaNotas.length === 0) {
    alert('Nenhuma média de nota disponível para gerar o PDF');
    return;
  }

  // Criar uma instância do jsPDF
  const doc = new jsPDF();

  // Adicionar título ao PDF
  doc.setFontSize(18);
  doc.text('Média de Notas por Operador', 20, 20);

  // Usar autoTable para gerar a tabela
  const tableData = this.mediaNotas.map(item => [
    item.operador,
    item.mediaNota.toFixed(2),  // Exibir média com 2 casas decimais
    item.totalAtendimentos.toString()
  ]);

  // Configurações para a tabela
  autoTable(doc,{
    startY: 30, // A posição Y inicial para a tabela
    head: [['Operador', 'Média de Nota', 'Total de Atendimentos']],  // Cabeçalho da tabela
    body: tableData,  // Dados da tabela
    theme: 'grid',  // Estilo da tabela
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontSize: 12 },  // Cabeçalho estilizado
    bodyStyles: { fontSize: 10 },  // Estilo das células
    margin: { top: 20, left: 10, right: 10 },
  });

  // Gerar o PDF e iniciar o download
  doc.save('media_notas_operadores.pdf');
}
}
  
  
  







