import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../service/auth/auth.service';
import { Router } from '@angular/router';
import { Database, ref, get, onValue } from '@angular/fire/database';


import { ChangeDetectorRef } from '@angular/core';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@Component({
  selector: 'app-painel-medico',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './painel-medico.component.html',
  styleUrl: './painel-medico.component.scss'
})
export class PainelMedicoComponent implements OnInit{

  psenha: string = '000';
  pguiche: string = '00';
  pnome: string = 'Nome';
  senha: DadosSenha[] = [];
  senhasChamadas: DadosSenha[] = [];
  setorUsuario: string = ''; // Armazena o setor do usuário logado
  setoresDisponiveis: string[] = []; // Lista de setores disponíveis
  setorSelecionado: string = ''; // Setor escolhido pelo usuário
  ppreferencial: boolean = false;
  private synth = window.speechSynthesis;
  audio = new Audio();
  private queue: (() => Promise<void>)[] = [];
  private isSpeaking = false;
  private senhasChamadasSubject = new BehaviorSubject<DadosSenha[]>([]);
  senhasChamadas$ = this.senhasChamadasSubject.asObservable();
  ni: number = 0;
  private setorUsuarioDefinido = false; // Impede que o setor seja alterado mais de uma vez

  private chamadaMap = new Map<string, number>();
  isProcessing: any;
  pacientesExibidos: { consultorio: string, nome: string }[] = [];

  constructor(
    private cdRef: ChangeDetectorRef,
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private db: Database
  ) {}

  ngOnInit() {
    this.carregarSetores(); // Carrega os setores disponíveis
    this.carregarInformacoesPacientes(); // Carrega as informações dos pacientes
    this.ouvirChamadasDePacientes();
  }

  // Carrega os setores do Firebase
  async carregarSetores() {
    const setoresRef = ref(this.db, `avelar/setor`);
    const snapshot = await get(setoresRef);

    if (snapshot.exists()) {
      const setoresData = snapshot.val() as Record<string, { setor: string }>;
      this.setoresDisponiveis = Object.values(setoresData).map(item => item.setor);
      console.log('Setores carregados:', this.setoresDisponiveis);
    } else {
      console.log('Nenhum setor encontrado no banco de dados.');
    }
  }

// Ouve as alterações no Firebase para exibir o paciente chamado
private ouvirChamadasDePacientes() {
  const painelMedicoRef = ref(this.db, 'avelar/senhachamada/painel');
  onValue(painelMedicoRef, snapshot => {
    if (snapshot.exists()) {
      const dadosPaciente = snapshot.val() as { nome: string; consultorio: string };
      this.psenha = dadosPaciente.nome; // Atualiza o nome do paciente no painel
      this.pguiche = dadosPaciente.consultorio; // Atualiza o consultório no painel

      // Fala o nome do paciente e o consultório
      this.falarPaciente(dadosPaciente);
    }
  });
}
 

  atualizarSenhasChamadas(senha: DadosSenha) {
    const senhas = this.senhasChamadasSubject.value;
    
    // Verifica se a senha já está na lista
    const senhaExistente = senhas.some(s => s.senha === senha.senha);
    
    // Se a senha já existir, não adiciona de novo
    if (!senhaExistente) {
      if (senhas.length >= 6) {
        senhas.shift(); // Remove a primeira senha se a lista estiver cheia
      }
      senhas.push(senha); // Adiciona a nova senha
      this.senhasChamadasSubject.next(senhas);
    }
  }
  pegavalor(valor: number) {
    this.ni = valor;
  }

  
  

  private carregarInformacoesPacientes() {
    const pacientesRef = ref(this.db, `avelar/pacientes`);
    
    get(pacientesRef).then(snapshot => {
      if (snapshot.exists()) {
        const pacientesData = snapshot.val() as Record<string, { consultorio: string, medico: string, nome: string, senhaid: string }>;
        
        // Mapeia os dados para exibir apenas consultorio e nome
        const pacientes = Object.values(pacientesData).map(paciente => ({
          consultorio: paciente.consultorio,
          nome: paciente.nome
        }));

        console.log('Informações dos pacientes:', pacientes);

        // Atualize a interface ou armazene os dados conforme necessário
        this.pacientesExibidos = pacientes;

        // Inicia a exibição e fala dos pacientes
        this.iniciarExibicaoPacientes();
      } else {
        console.log('Nenhum paciente encontrado na coleção.');
      }
    }).catch(error => {
      console.error('Erro ao buscar informações dos pacientes:', error);
    });
  }

  private iniciarExibicaoPacientes() {
    let index = 0;
    let isProcessingPaciente = false; // Flag to prevent repeated calls
  
    const processPaciente = async () => {
      if (this.pacientesExibidos.length === 0 || isProcessingPaciente) {
        return;
      }

      isProcessingPaciente = true; // Set the flag to true to indicate processing

      const paciente = this.pacientesExibidos[index];
      this.psenha = paciente.nome; // Atualiza o nome do paciente no painel
      this.pguiche = paciente.consultorio; // Atualiza o consultório no painel

      // Força a atualização da interface
      this.cdRef.detectChanges();

      // Toca o áudio antes de falar o nome do paciente
      this.audio.src = "../assets/audio/SOM.wav";
      this.audio.load();

      try {
        await new Promise<void>((resolve, reject) => {
          this.audio.oncanplaythrough = () => resolve();
          this.audio.onerror = () => reject("Erro ao carregar o áudio");
        });

        await this.audio.play();
        await new Promise<void>(resolve => {
          this.audio.onended = () => resolve();
        });

        // Fala o nome do paciente e o número do consultório
        await this.falarPaciente(paciente);
      } catch (error) {
        console.error("Erro ao processar o áudio ou fala do paciente: ", error);
      isProcessingPaciente = false; // Reset the flag after processing
      setTimeout(processPaciente, 3000); // Aguarda antes de processar o próximo paciente
    };
      index = (index + 1) % this.pacientesExibidos.length; // Cicla pelos pacientes
      setTimeout(processPaciente, 3000); // Aguarda antes de processar o próximo paciente
    };

    processPaciente();
  }
  
  private async falarPaciente(paciente: { consultorio: string, nome: string }) {
    return new Promise<void>((resolve, reject) => {
      const utterThis = new SpeechSynthesisUtterance(`Paciente ${paciente.nome}, Consultório ${paciente.consultorio}`);
      utterThis.rate = 0.9;
  
      utterThis.onend = () => resolve();
      utterThis.onerror = event => {
        console.error('Erro ao falar:', event.error);
        reject(event.error);
      };
  
      this.synth.speak(utterThis);
    });
  }
}



