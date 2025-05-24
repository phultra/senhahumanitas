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
  medico: string;
  consultorio: string;
  nome: string;
 
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
  // filtroNota: string = '';
  


  filtroDataInicio: string = '';
filtroDataFim: string = '';

  diasList: string[] = [];
  operadores: string[] = [];
  guichesList: string[] = [];
  senhasList: string[] = [];
  // notasList: number[] = [];
  
  

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
      const senhaRef = ref(this.db, `humanitas/senhafinalizada`);
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
          // this.notasList = [...new Set(dadosArray.map((item) => Number(item.nota)))];
          
       
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
              (this.filtroSenha ? valor.senha === this.filtroSenha : true) 
              // (!valor['medico'] || valor['medico'] === '')
              // (this.filtroNota ? valor.nota === Number(this.filtroNota) : true) 
             
              
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
  // Primeira tabela: senhas sem médico
  let tabelaHTML = `
     <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px;">
      <h4 style="text-align:center; margin-bottom: 12px;">Senhas finalizadas pelo Operador</h4>
      <table class="table-bordered" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Data</th>
            <th>Operador</th>
            <th>Guichê</th>
            <th>Senha</th>
            <th>Duração Atendimento (ms)</th>
          </tr>
        </thead>
        <tbody>`;

  // Senhas sem médico
  const semMedico = dados.filter(valor =>
    (!valor.medico || valor.medico === '') &&
    !(
      (valor.nome && valor.nome.toUpperCase().includes('NÃO COMPARECEU'))
      
    ) 
  );
  for (let i = 0; i < semMedico.length; i++) {
    const valor = semMedico[i];
    tabelaHTML += `<tr>
      <td>${valor.dataCompleta.toLocaleDateString() || 'Não informado'}</td>
      <td>${valor.operador || 'Não informado'}</td>
      <td>${valor.guiche || 'Não informado'}</td>
      <td>${valor.senha || 'Não informado'}</td>
      <td>${valor.duracaoAtendimento || 'Não informado'}</td>
    </tr>`;
  }
  tabelaHTML += `</tbody></table></div>`;

  // Segunda tabela: senhas com médico
  const comMedico = dados.filter(valor => valor.medico && valor.medico !== '');
  if (comMedico.length > 0) {
    tabelaHTML += `
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-top: 24px;">
        <h4 style="text-align:center; margin-bottom: 12px;">Senhas finalizadas pelo Médico</h4>
        <table class="table-bordered" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Data</th>
              <th>Paciente</th>
              <th>Médico</th>
              <th>Consultório</th>
              
              <th>Senha</th>
              
            </tr>
          </thead>
          <tbody>`;
    for (let i = 0; i < comMedico.length; i++) {
      const valor = comMedico[i];
       if (!valor.nome || !valor.nome.toUpperCase().includes('NÃO COMPARECEU'))
      tabelaHTML += `<tr>
        <td>${valor.dataCompleta.toLocaleDateString() || 'Não informado'}</td>
        <td>${valor.nome || 'Não informado'}</td>
        <td>${valor.medico || 'Não informado'}</td>
        <td>${valor.consultorio || 'Não informado'}</td>
        
        <td>${valor.senha || 'Não informado'}</td>
        
      </tr>`;
    }
    tabelaHTML += `</tbody></table></div>`;
  }

   // Terceira tabela: senhas com "NÃO COMPARECEU" no nome, operador ou médico
  const naoCompareceu = dados.filter(valor =>
    (valor.nome && valor.nome.toUpperCase().includes('NÃO COMPARECEU')) ||
    (valor.medico && valor.medico.toUpperCase().includes('NÃO COMPARECEU')) ||
    (valor.operador && valor.operador.toUpperCase().includes('NÃO COMPARECEU'))
  );
  if (naoCompareceu.length > 0) {
    tabelaHTML += `
      <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; margin-top: 24px;">
        <h4 style="text-align:center; margin-bottom: 12px;">Senhas que não compareceram</h4>
        <table class="table-bordered" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Data</th>
              <th>Nome</th>
              <th>Operador</th>
              
              <th>Médico</th>
              
              <th>Senha</th>
              
            </tr>
          </thead>
          <tbody>`;
    for (let i = 0; i < naoCompareceu.length; i++) {
      const valor = naoCompareceu[i];
      tabelaHTML += `<tr>
        <td>${valor.dataCompleta.toLocaleDateString() || 'Não informado'}</td>
        <td>${valor.nome || 'Não informado'}</td>
        <td>${valor.operador || 'Não informado'}</td>
        
        <td>${valor.medico || 'Não informado'}</td>
        
        <td>${valor.senha || 'Não informado'}</td>
        
      </tr>`;
    }
    tabelaHTML += `</tbody></table></div>`;
  }

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
    } 
    
    this.exibirRelatorio();
  }

  

  async relatorioParaBaixar() {
  try {
    const setoresRef = ref(this.db, 'humanitas/senhafinalizada');
    const snapshot = await get(setoresRef);

    if (snapshot.exists()) {
      const dados = snapshot.val();
      const dadosArray: RelatorioItem[] = Object.values(dados);

      if (dadosArray.length === 0) {
        alert('Nenhum dado encontrado para exportação.');
        return;
      }

      // Separar os dados em dois grupos
      const semMedico = dadosArray.filter(item =>
  (!item.medico || item.medico === '') &&
  !( (item.nome && item.nome.toUpperCase().includes('NÃO COMPARECEU')) )
);
      const comMedico = dadosArray.filter(item =>
  item.medico && item.medico !== '' &&
  (!item.nome || !item.nome.toUpperCase().includes('NÃO COMPARECEU'))
);
       const naoCompareceu = dadosArray.filter(item =>
        (item.nome && item.nome.toUpperCase().includes('NÃO COMPARECEU'))
      );

      // Criar o documento PDF
      const doc = new jsPDF();
      doc.text('SENHAS POR OPERADOR(A)', 14, 10);

      // Tabela 1: Senhas sem médico
      autoTable(doc, {
        startY: 20,
        head: [['Data', 'Operador', 'Guichê', 'Senha', 'Duração']],
        body: semMedico.map(item => {
          let dataFormatada = 'N/D';
          let timestamp = Number(item.finalatendimento);
          if (timestamp && !isNaN(timestamp)) {
            const data = new Date(timestamp);
            if (!isNaN(data.getTime())) {
              dataFormatada = data.toLocaleDateString();
            }
          }
          let duracaoFormatada = 'N/D';
          let finalAtendimento = item.finalatendimento;
          let horaChamada = item.horachamada;
          if (finalAtendimento && horaChamada) {
            let duracao = finalAtendimento - horaChamada;
            if (!isNaN(duracao) && duracao > 0) {
              duracaoFormatada = duracao + 'ms';
            }
          }
          return [
            dataFormatada,
            item.operador || 'N/D',
            item.guiche || 'N/D',
            item.senha || 'N/D',
            duracaoFormatada,
          ];
        }),
        theme: 'grid'
      });

      // Tabela 2: Senhas com médico
      if (comMedico.length > 0) {
        // Espaço entre as tabelas
        let finalY = (doc as any).lastAutoTable.finalY || 30;
        doc.text('SENHAS POR MÉDICO(A)', 14, finalY + 10);

        autoTable(doc, {
          startY: finalY + 15,
          head: [['Data','Paciente', 'Médico', 'Consultório', 'Senha']],
          body: comMedico.map(item => {
            let dataFormatada = 'N/D';
            let timestamp = Number(item.finalatendimento);
            if (timestamp && !isNaN(timestamp)) {
              const data = new Date(timestamp);
              if (!isNaN(data.getTime())) {
                dataFormatada = data.toLocaleDateString();
              }
            }
            let duracaoFormatada = 'N/D';
            let finalAtendimento = item.finalatendimento;
            let horaChamada = item.horachamada;
            if (finalAtendimento && horaChamada) {
              let duracao = finalAtendimento - horaChamada;
              if (!isNaN(duracao) && duracao > 0) {
                duracaoFormatada = duracao + 'ms';
              }
            }
            return [
              dataFormatada,
              item.nome || 'N/D',
              item.medico || 'N/D',
              item.consultorio || 'N/D',
              item.senha || 'N/D'
              
            ];
          }),
          theme: 'grid'
        });
      }
       // Tabela 3: Senhas com "NÃO COMPARECEU" no nome
      if (naoCompareceu.length > 0) {
        let finalY = (doc as any).lastAutoTable.finalY || 30;
        doc.text('SENHAS QUE NÃO COMPARECERAM', 14, finalY + 10);

        autoTable(doc, {
          startY: finalY + 15,
          head: [['Data', 'Nome', 'Operador',  'Médico',  'Senha']],
          body: naoCompareceu.map(item => {
            let dataFormatada = 'N/D';
            let timestamp = Number(item.finalatendimento);
            if (timestamp && !isNaN(timestamp)) {
              const data = new Date(timestamp);
              if (!isNaN(data.getTime())) {
                dataFormatada = data.toLocaleDateString();
              }
            }
            let duracaoFormatada = 'N/D';
            let finalAtendimento = item.finalatendimento;
            let horaChamada = item.horachamada;
            if (finalAtendimento && horaChamada) {
              let duracao = finalAtendimento - horaChamada;
              if (!isNaN(duracao) && duracao > 0) {
                duracaoFormatada = duracao + 'ms';
              }
            }
            return [
              dataFormatada,
              item.nome || 'N/D',
              item.operador || 'N/D',
              
              item.medico || 'N/D',
              
              item.senha || 'N/D',
              
            ];
          }),
          theme: 'grid'
        });
      }

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
  
  
  







